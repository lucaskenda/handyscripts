
const St = imports.gi.St;
const Clutter = imports.gi.Clutter;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Lang = imports.lang;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Gtk = imports.gi.Gtk;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Menu = Me.imports.src.menu;

let button;

function init() {}

function enable() {
	_indicator = new Menu.Menu;
	Main.panel.addToStatusArea('handy-scripts', _indicator, 0, 'right');
}

function disable() {
	button.destroy();
}
