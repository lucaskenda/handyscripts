const St = imports.gi.St;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Gtk = imports.gi.Gtk;
const Soup = imports.gi.Soup;
const Clutter = imports.gi.Clutter;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Util = imports.misc.util;
const Lang = imports.lang;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;

const DefaultFolder = GLib.build_filenamev([global.userdatadir, 'extensions/lucaskenda@gmail.com']);
var Folder = DefaultFolder;
const ScriptsDir = 'scripts';

const IS_FOLDER = 2;
const SCHEMA = 'org.gnome.shell.extensions.handyscripts';
const SCRIPTS_BUTTON_SHOWHIDE = 'scripts-button-show';
const SCRIPTS_DEFAULT_PATH_ENABLEDISABLE = 'scripts-default-path-enabled';
const SCRIPTS_FOLDER_PATH = 'scripts-folder-path';

// Status menu
const Menu = new Lang.Class({
    Name: 'Menu.Menu',
    Extends: PanelMenu.Button,

    _init: function () {

      this.parent(1, 'MainPopupMenu', false);

			this._settings = Convenience.getSettings(SCHEMA);

			// Set folder
			//if(this._settings.get_string(SCRIPTS_FOLDER_PATH) != '') {
			//	Folder = this._settings.get_string(SCRIPTS_FOLDER_PATH);
			//}

      let box = new St.BoxLayout();
      let icon = new St.Icon({ icon_name: 'utilities-terminal-symbolic', style_class: 'system-status-icon'});
      let toplabel = new St.Label({ text: '',
        y_expand: true,
        y_align: Clutter.ActorAlign.CENTER });

      box.add(icon);
      box.add(toplabel);

      this.actor.add_child(box);
      this.actor.connect('button_press_event', Lang.bind(this, this._refreshMenu));

      this._renderMenu();
    },

    _executeScript: function(fileName) {
      try {
  			Util.trySpawnCommandLine('gnome-terminal -- sh -c \"bash \'' + fileName + '\';sleep 3\"');
  			//Main.notify('Starting script!');
      } catch(err) {
        Main.notify('Error: ' + err);
      }
    },

    _openFolder: function() {
      Util.trySpawnCommandLine('nautilus ' + Folder + '/' + ScriptsDir + '/');
    },

    _refreshMenu: function () {
        if (this.menu.isOpen) {
            this.menu.removeAll();
            this._renderMenu();
        }
    },

    _renderMenu: function () {

      let dir = Gio.file_new_for_path(Folder + '/' + ScriptsDir);
      let files = dir.enumerate_children(Gio.FILE_ATTRIBUTE_STANDARD_NAME, Gio.FileQueryInfoFlags.NONE, null);
      let file, fileName;
      let folderArray = [];

      while((file = files.next_file(null))) {

        // Add only folders.
        if(file.get_file_type() == IS_FOLDER) {

          let fileName = file.get_name();

          let menu = new PopupMenu.PopupSubMenuMenuItem(fileName, true);
          menu.icon.icon_name = 'folder-symbolic';

          folderArray.push({
            name: fileName,
            path: Folder + '/' + ScriptsDir + '/' + file.get_name(),
            submenu: menu
          });

        }

      }

      // For each folder list files that ends with .sh
      for(var i=0; i < folderArray.length; i++) {

        dir = Gio.file_new_for_path(folderArray[i].path);
        files = dir.enumerate_children(Gio.FILE_ATTRIBUTE_STANDARD_NAME, Gio.FileQueryInfoFlags.NONE, null);
        let file;

        while((file = files.next_file(null))) {

          let fileName = file.get_name();

          if(fileName.endsWith('.sh')) {
            let popupMenuItem = new PopupMenu.PopupImageMenuItem(fileName.split('.')[0], 'media-playback-start-symbolic');
            popupMenuItem.connect('activate', this._executeScript.bind(this, folderArray[i].path + '/' + fileName));
            folderArray[i].submenu.menu.addMenuItem(popupMenuItem);
          }

        }

        this.menu.addMenuItem(folderArray[i].submenu);

      }

      // Scripts item
      if(this._settings.get_boolean(SCRIPTS_BUTTON_SHOWHIDE) == true) {
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        let Scripts = new PopupMenu.PopupImageMenuItem('Scripts', 'system-run-symbolic');
        this.menu.addMenuItem(Scripts);
        Scripts.connect('activate', this._openFolder.bind(this));
      }

      this.actor.show();

    }
});

// Menu variable
let menu;
let settings;

function init() {
	log(`Initializing ${Me.metadata.name} version ${Me.metadata.version}`);
	this._settings = Convenience.getSettings('org.gnome.shell.extensions.handyscripts');
}

function enable() {
	log(`Enabling ${Me.metadata.name} version ${Me.metadata.version}`);
	menu = new Menu;
	Main.panel.addToStatusArea('handy-scripts', menu, 0, 'right');
}

function disable() {
	log(`Disabling ${Me.metadata.name} version ${Me.metadata.version}`);
	menu.destroy();
}
