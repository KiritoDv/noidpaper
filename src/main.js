const electron = require('electron')
const { app, BrowserWindow, ipcMain, Menu, Tray, nativeImage } = require('electron')

const path = require('path');

const config = require('electron-json-config');

const windowList = {};
const port = 3000;

//const io = require('socket.io')(port);
var child = require('child_process').execFile;

const defaultBackground = path.join(__dirname, "assets", "default.png");

let tray = null
let editWindow = null

let win32 = false;

function createAppWindow() {

    win32 = (process.platform === "win32");

    if (!win32) {
        setupMonitors();
    } else {
        if (!config.has('monitor-0')) {
            config.set('monitor-0', defaultBackground)
            updateBackground()
        }
    }

    //setupSocket();
    setupIPC();
    tray = setupTray();

    editWindow = new BrowserWindow({
        width: 800,
        height: 600,
        transparent: true,
        frame: false,
        icon: path.join(__dirname, 'assets', 'icon.png')
    })

    editWindow.loadURL(`file://${__dirname}/edit/index.html`)

    editWindow.on('minimize', (event) => {
        event.preventDefault();
        editWindow.hide();
    })

    editWindow.on('close', (event) => {
        if (!app.isQuiting) {
            event.preventDefault();
            editWindow.hide();
        }
        return false;
    });
}

app.on('ready', () => {
    createAppWindow();
})

function setupMonitors() {
    let displays = electron.screen.getAllDisplays()

    displays.map((m, index) => {
        var window = new BrowserWindow({
            hasShadow: false,
            show: false,
            frame: false,
            resizable: false,
            type: 'desktop',
            acceptFirstMouse: true
        });

        window.loadURL(`file://${__dirname}/display/index.html`)
        window.webContents.on('did-finish-load', function () {
            const { width, height } = m.size
            const { x, y } = m.bounds
            window.setPosition(x, y);
            window.setSize(width, height);
            window.setIgnoreMouseEvents(true);

            if (!config.has('monitor-' + index)) {
                config.set('monitor-' + index, "file://" + defaultBackground)
            }

            window.webContents.send('update-bg', config.get('monitor-' + index))
            windowList[index] = window
            window.show();
            setTimeout(() => {
                window.focus();
            }, 200);
        });

        window.on('closed', function () {
            window = null
        });
    })
}

function setupSocket() {
    /*
    io.on('connection', (socket) => {
        socket.on('update', (json) => {
            json = JSON.parse(json);
            if (windowList[json.monitor]) {
                windowList[json.monitor].webContents.send('update-var i = 0';
                var id = setInterval(() => {
                    if (windowList[i]) {
                        windowList[i].destroy();
                        i++;
                    } else {
                        clearInterval(id);
                    }
                }, 1);bg', json.url)
                config.set('monitor-' + json.monitor, json.url)
            }
        })
        socket.on('info', (data) => {
            var i = 0;
            var tmp = {};
            var id = setInterval(() => {
                if (windowList[i]) {
                    tmp[i] = config.get("monitor-" + i);
                    i++;
                } else {
                    clearInterval(id);
                    socket.emit('info', tmp)
                }
            }, 1);
        })
        socket.on('close', (data) => {
            closeApp();
        })
    })

    */
}

function setupIPC() {    
    ipcMain.on('update-lc', (event, json) => {
        updateBackground(win32, json)
    })
    ipcMain.on('execute', (event, req) => {
        switch (req.toLowerCase()) {
            case 'close':
                editWindow.hide();
                break;
            case 'minimize':
                editWindow.hide();
                break;
            case 'switch':
                editWindow.isMaximized() ? editWindow.unmaximize() : editWindow.maximize();
        }
    })
    ipcMain.on('monitor-list', (event, json) => {
        var i = 0;
        if (win32) {
            event.sender.send('monitor-list', 1);
        } else {
            var id = setInterval(() => {
                if (windowList[i]) {
                    i++;
                } else {
                    clearInterval(id);
                    event.sender.send('monitor-list', i);
                }
            }, 1);
        }
    })
}

function updateBackground(win32, json) {
    if (win32) {        
        var executablePath = path.join(__dirname, "win32", "changewp.exe");
        var parameters = [json.url];

        child(executablePath, parameters, function (err, data) {
            console.log(err)
            console.log(data.toString());
        });        
        config.set('monitor-0', json.url)
    } else {
        if (windowList[json.monitor]) {
            windowList[json.monitor].webContents.send('update-bg', json.url)
            config.set('monitor-' + json.monitor, 'file://' + json.url)
        }
    }
}

function setupTray() {
    var tray = new Tray(path.join(__dirname, 'assets', 'icon.png'))
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Restore',
            click() {
                editWindow.restore();
                editWindow.show();
            }
        },
        {
            label: 'Exit',
            click() {
                closeApp();
            }
        }
    ])
    tray.setToolTip('Noidpaper')
    tray.setContextMenu(contextMenu)
    return tray;
}

function closeApp() {    
    if (!win32) {
        var i = 0;
        var id = setInterval(() => {
            if (windowList[i]) {
                windowList[i].destroy();
                i++;
            } else {
                clearInterval(id);
            }
        }, 1);
    }
    app.exit(0);    
}