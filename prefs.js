const Gtk = imports.gi.Gtk;
const GLib = imports.gi.GLib;
const Lang = imports.lang;
const Soup = imports.gi.Soup;
const Gio = imports.gi.Gio;

const Gettext = imports.gettext.domain('handyscripts');
const _ = Gettext.gettext;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;

const SCHEMA = 'org.gnome.shell.extensions.handyscripts';
const SCRIPTS_BUTTON_SHOWHIDE = 'scripts-button-show';
const SCRIPTS_DEFAULT_PATH_ENABLEDISABLE = 'scripts-default-path-enabled';
const SCRIPTS_FOLDER_PATH = 'scripts-folder-path';
const NOTIFICATIONS = 'notifications';

const AppDir = GLib.build_filenamev([global.userdatadir, 'extensions/lucaskenda@gmail.com']);
const ScriptsDir = 'scripts';

let settings;

function init() {
	settings = Convenience.getSettings(SCHEMA);
	Convenience.initTranslations("handyscripts");
}

function buildPrefsWidget() {

	let frame = new Gtk.Box({
		orientation: Gtk.Orientation.VERTICAL,
		border_width: 10, margin: 20});

	frame.set_spacing(10);

	var showScriptsButtonInMenuToggle = _createCheckBox(
		SCRIPTS_BUTTON_SHOWHIDE,
		_("Scripts folder link in menu"),
		_("Enable/Disable default Scripts folder path."),
		null
	);

	var scriptFolderEntry = _createOnlyEntry(
		SCRIPTS_FOLDER_PATH,
		_("Scripts folder path"),
		_("Path where are located the scripts."),
		'',
		true
	);

	var scriptsDefaultPathToggle = _createCheckBox(
		SCRIPTS_DEFAULT_PATH_ENABLEDISABLE,
		_("Default Scripts folder path"),
		_("Enable/Disable button to scripts folder."),
		function(active){
			scriptFolderEntry.set_sensitive(active);
			scriptFolderEntry.text = '';
		}
	);

	if(settings.get_boolean(SCRIPTS_DEFAULT_PATH_ENABLEDISABLE)) {
		scriptFolderEntry.set_sensitive(true);
	} else {
		scriptFolderEntry.set_sensitive(false);
	}

	var gitLabel = _createLabel(
		_("Download from GIT"),
		_("Download from Git repository. Only HTTPS!")
	);

	var repositoryComboBox = _createComboBox(
		'repository',
		_("Repository"),
		_("Select repository"),
		{
			'Github': _("Github"),
			'Gitlab' : _("Gitlab"),
			'Bitbucket' : _("Bitbucket")
		}
	);

	var gitUrlEntry = _createEntry(
		'notifications',
		_("Git https"),
		_("Git https url"),
		'',
		true
	);

	var usernameEntry = _createEntry(
		'notifications',
		_("Username"),
		_("Git username"),
		'',
		true
	);

	var passwordEntry = _createEntry(
		'notifications',
		_("Password"),
		_("Git password"),
		'',
		false
	);

	var updateButton = _createButton(
		'notifications',
		_("Update"),
		_("Update")
	);

	var updateStatusLabel = _createLabel(
		'',
		_("Message")
	);

	var emptyLabel = _createLabel('','');

	updateButton.connect('clicked', function() {
		onClicked(updateButton, updateStatusLabel);
	});

	frame.add(showScriptsButtonInMenuToggle);
	frame.add(scriptsDefaultPathToggle);
	frame.add(scriptFolderEntry);
	frame.add(emptyLabel);
	frame.add(gitLabel);
	frame.add(repositoryComboBox);
	frame.add(gitUrlEntry);
	frame.add(usernameEntry);
	frame.add(passwordEntry);
	frame.add(updateButton);
	frame.add(updateStatusLabel);
	frame.show_all();

	return frame;
}

function _createCheckBox(key, text, tooltip, changeFunction) {

	let box = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL });
	let label = new Gtk.Label({ label: text, xalign: 0, tooltip_text:tooltip });
	let widget = new Gtk.Switch({ active: settings.get_boolean(key) });

	widget.connect('notify::active', function(switch_widget) {
		settings.set_boolean(key, switch_widget.active);
		changeFunction(switch_widget.active);
	});

	box.pack_start(label, true, true, 0);
	box.add(widget);

	return box;
}

function _createLabel(text, tooltip) {
	let label = new Gtk.Label({ label: text, xalign: 0, tooltip_text:tooltip });
	return label;
}

function _createComboBox(key, text, tooltip, values) {

	let box = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL });
	let label = new Gtk.Label({ label: text, xalign: 0, tooltip_text:tooltip });
	let widget = new Gtk.ComboBoxText();

	for(id in values) {
		widget.append(id, values[id]);
	}

	widget.set_active_id(settings.get_string(key));
	widget.connect('changed', function(combo_widget) {
		settings.set_string(key, combo_widget.get_active_id());
	});

	box.pack_start(label, true, true, 0);
	box.add(widget);

	return box;
}

function _createButton(key, text, tooltip) {
	let widget = new Gtk.Button({ label: text });
	return widget;
}

function _createEntry(key, text, tooltip, placeholder, setVisibility) {

	let box = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL });
	let label = new Gtk.Label({ label: text, xalign: 0, tooltip_text:tooltip });
	let widget = new Gtk.Entry();

	widget.set_placeholder_text(placeholder);
	widget.set_visibility(setVisibility);

	box.pack_start(label, true, true, 0);
	box.add(widget);

	return box;
}

function _createOnlyEntry(key, text, tooltip, placeholder, setVisibility) {

	let widget = new Gtk.Entry();
	widget.text = settings.get_string(key);

	widget.connect('changed', function() {
		settings.set_string(key, widget.get_text());
	});

	widget.set_placeholder_text(placeholder);
	widget.set_visibility(setVisibility);

	return widget;
}


function onClicked(updateButton, updateStatusLabel) {

	// Open the file
	let file = Gio.file_new_for_path(AppDir + '/download/tmp.zip');
	let fstream = file.replace(null, false, Gio.FileCreateFlags.NONE, null);

	var _httpSession = new Soup.SessionAsync();
	Soup.Session.prototype.add_feature.call(_httpSession, new Soup.ProxyResolverDefault());

	// Variables for the progress bar
	var total_size;
	var bytes_so_far = 0;

	// Update button text.
	updateButton.set_label("Updating!");

	// Create an http message
	var request = Soup.Message.new('GET', 'https://github.com/lucaskenda/handyscripts/archive/master.zip');

	// got_headers event
	request.connect('got_headers', Lang.bind(this, function(message){
		total_size = message.response_headers.get_content_length()
	}));

	// Got_chunk event
	request.connect('got_chunk', Lang.bind(this, function(message, chunk){

		bytes_so_far += chunk.length;

		if(total_size) {
			let fraction = bytes_so_far / total_size;
			let percent = Math.floor(fraction * 100);
			updateStatusLabel.set_label("Download "+percent+"% done ("+bytes_so_far+" / "+total_size+" bytes)");
		}

		fstream.write(chunk.get_data(), null, chunk.length);
	}));

	// Queue the http request
	_httpSession.queue_message(request, function(_httpSession, message) {

		if(message.status_code != 404) {
			updateStatusLabel.set_label('Download is done!');
			fstream.close(null);
		} else {
			updateStatusLabel.set_label('Download error ' + message.status_code + '!');
			fstream.close(null);
			GLib.unlink(AppDir + '/download/tmp.zip');
		}

		updateButton.set_label("Update");

	});

}
