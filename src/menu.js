'use strict';

const St = imports.gi.St;
const Clutter = imports.gi.Clutter;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Main = imports.ui.main;
const Util = imports.misc.util;
const Lang = imports.lang;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const IS_FOLDER = 2;

const AppDir = GLib.build_filenamev([global.userdatadir, 'extensions/lucaskenda@gmail.com']);
const ScriptsDir = 'scripts';

// Status menu
const Menu = new Lang.Class({
    Name: 'Menu.Menu',
    Extends: PanelMenu.Button,

    _init: function () {

      this.parent(1, 'MainPopupMenu', false);

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
  			// Main.notify('Starting script!');
      } catch(err) {
        Main.notify('Error: ' + err);
      }
    },

    _openFolder: function() {
      Util.trySpawnCommandLine('nautilus ' + AppDir + '/' + ScriptsDir + '/');
    },

    _refreshMenu: function () {
        if (this.menu.isOpen) {
            this.menu.removeAll();
            this._renderMenu();
        }
    },

    _renderMenu: function () {

      let dir = Gio.file_new_for_path(AppDir + '/' + ScriptsDir);
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
            path: AppDir + '/' + ScriptsDir + '/' + file.get_name(),
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

      this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

      let Scripts = new PopupMenu.PopupImageMenuItem('Scripts', 'system-run-symbolic');
      this.menu.addMenuItem(Scripts);

      Scripts.connect('activate', this._openFolder.bind(this));

      this.actor.show();

    }
});
