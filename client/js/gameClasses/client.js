var gameScale = parseFloat(GameConfig.config['gameScale'])
var uniqueCounter = 0
// so by now GameConfig from /config has definitely loaded otherwise this doesn't get called. 

// For all code outside of ige THE global variable is vlg.  That's how we'll pass references across different libraries.


var Client = IgeClass.extend({
    classId: 'Client',

    init: function () {
        //ige.addComponent(IgeEditorComponent);
        // ige.addComponent(IgeAudioComponent);

        // Load our textures
        var self = this;
        this.audio = {};
        this.textures = {};
        this.fsm = new IgeFSM();

        $("body").disableSelection();

        // probably should just create a state called game loaded.
        this.fsm.defineState('loaded', {
            enter: function (data, completeCallback) {
                // ClientHelpers.hideDialogs();
                vlg.log.info('entering state this.fsm.loaded');
                dataLayer.push({'event': 'loaded'});
                vlg.bindSounds();
                // start Level Music.
                vlg.music['welcome'].fadeOut(0, 2000);
                vlg.music['levelfull1'].fadeIn(1.0, 2000);
                //hope this works this simply.
                ige.client.fsm.enterState('select');
                completeCallback();
            },

            exit: function (data, completeCallback) {
                vlg.log.info('exiting state this.fsm.loaded');


                completeCallback();
            }
        });

        // Define the fsm states
        this.fsm.defineState('select', {
            enter: function (data, completeCallback) {
                // ClientHelpers.hideDialogs();

                // Hook mouse events
                vlg.log.info('entering state this.fsm.select');
                dataLayer.push({'event': 'select'});

                var self = this,
                    tileMap = ige.$('tileMap1');

                ige.$('vp1')
                    .mousePan.enabled(true)
                    .scrollZoom.enabled(true)

                self.mouseUpHandle = tileMap.on('mouseUp', function (event, evc, data) {
                    var tile = tileMap.mouseToTile();

                    ige.$('bob').walkToTile(tile.x, tile.y);
                });
                if(ige.client.eventEmitter)
                    ige.client.eventEmitter.emit('executePendingAction', null);
                completeCallback();
            },
            exit: function (data, completeCallback) {
                // Un-hook mouse events
                vlg.log.info('exiting state this.fsm.select');

                var self = this,
                    tileMap = ige.$('tileMap1');

                tileMap.off('mouseUp', self.mouseUpHandle);

                if(ige.client.currentMouseOverPanelOwner){
                    ige.client.currentMouseOverPanelOwner.cancelTimeouts();
                    ige.client.currentMouseOverPanelOwner.hideMouseOverPanel();
                }

                completeCallback();
            }
        });

        this.fsm.defineState('move', {
            enter: function (data, completeCallback) {
                var self = this,
                    tileMap = ige.$('tileMap1');

                dataLayer.push({'event': 'move'});

                ige.client.showGrid('tileMap1');

                ige.$('vp1')
                    .mousePan.enabled(true)
                    .scrollZoom.enabled(true)

                ige.$('outlineEntity').mount(ige.$('tileMap1'))
                    .hide();
                ige.$('vp1').mousePan.off('panStart', clientSelf.mousePanStartHandler);
                ige.$('vp1').mousePan.off('panEnd', clientSelf.mousePanEndHandler);

                $('#moveButton').unbind("click")
                    .click(function(){
                        clientSelf.fsm.enterState('select');
                    })
                $('#endMove').show()

                self.isMouseMoved = false;
                self.mouseDownHandle = tileMap.on('mouseDown', function (event, evc, data) {
                    if (!ige.client.data('moveItem')) {
                        // We're not already moving an item so check if the user
                        // just clicked on a building
                        var tile = tileMap.mouseToTile(),
                            item = ige.client.itemAt('tileMap1', tile.x, tile.y);

                        if (item) {
                            ige.$('vp1')
                                .mousePan.enabled(false)
                            self.isMouseMoved = false;

                            // The user clicked on a building so set this as the
                            // building we are moving.
                            ige.client.data('moveItem', item);
                            ige.client.data('moveItemX', item.data('tileX'));
                            ige.client.data('moveItemY', item.data('tileY'));

                            //set initial position to lastmoveX-Y data
                            item.data('lastMoveX', item.data('tileX'));
                            item.data('lastMoveY', item.data('tileY'));

                            ige.$('outlineEntity').tileWidth = item.data('tileWidth');
                            ige.$('outlineEntity').tileHeight = item.data('tileHeight');
                            ige.$('outlineEntity').isFeasible = true;
                            ige.$('outlineEntity').translateToTile(item.data('tileX'), item.data('tileY'));
                            ige.$('outlineEntity').show();
                        }
                    } else {
                        // We are already moving a building, place this building
                        // down now
                        var map = tileMap.map,
                            item = ige.client.data('moveItem'),
                            moveX = item.data('lastMoveX'),
                            moveY = item.data('lastMoveY');

                        if (map.collision(moveX, moveY, item.data('tileWidth'), item.data('tileHeight')) && !map.collisionWithOnly(moveX, moveY, item.data('tileWidth'), item.data('tileHeight'), item)) {
                            return;
                        }

                        self.isMouseMoved = false;
                        ige.$('vp1')
                            .mousePan.enabled(true)

                        item.moveTo(moveX, moveY);
                        // Clear the data
                        ige.client.data('moveItem', '');
                        ige.$('outlineEntity').hide();

                        API.updateObject(item, moveX, moveY)
                    }
                });

                self.mouseUpHandle = tileMap.on('mouseUp', function (event, evc, data) {
                    if(self.isMouseMoved === true && ige.client.data('moveItem')){
                        // We are already moving a building, place this building
                        // down now
                        var map = tileMap.map,
                            item = ige.client.data('moveItem'),
                            moveX = item.data('lastMoveX'),
                            moveY = item.data('lastMoveY');

                        if (map.collision(moveX, moveY, item.data('tileWidth'), item.data('tileHeight')) && !map.collisionWithOnly(moveX, moveY, item.data('tileWidth'), item.data('tileHeight'), item)) {
                            return;
                        }

                        self.isMouseMoved = false;
                        ige.$('vp1')
                            .mousePan.enabled(true)

                        item.moveTo(moveX, moveY);
                        // Clear the data
                        ige.client.data('moveItem', '');
                        ige.$('outlineEntity').hide();

                        API.updateObject(item, moveX, moveY)
                    }
                });

                self.mouseMoveHandle = ige.$('vp1').on('mouseMove', function (event, evc, data) {
                    self.isMouseMoved = true;

                    var item = ige.client.data('moveItem'),
                        map = tileMap.map,
                        tile = tileMap.mouseToTile();

                    if (item) {
                        var tileCenterX = item.data('tileWidth'), tileCenterY = item.data('tileHeight');

                        if (tileCenterX % 2 === 0)
                            tileCenterX -= 1;
                        if (tileCenterY % 2 === 0)
                            tileCenterY -= 1;

                        tile.x -= Math.floor(tileCenterX / 2);
                        tile.y -= Math.floor(tileCenterY / 2);

                        // Check if the current tile is in grid, and align if not
                        if(tile.x < 0)
                            tile.x = 0;

                        if(tile.y < 0)
                            tile.y = 0;

                        if(tile.x > ige.$('tileMap1').gridSize().x - item.data('tileWidth'))
                            tile.x = ige.$('tileMap1').gridSize().x - item.data('tileWidth');

                        if(tile.y > ige.$('tileMap1').gridSize().y - item.data('tileHeight'))
                            tile.y = ige.$('tileMap1').gridSize().y - item.data('tileHeight');

                        // Check if the current tile is occupied or not
                        if (!map.collision(tile.x, tile.y, item.data('tileWidth'), item.data('tileHeight')) || map.collisionWithOnly(tile.x, tile.y, item.data('tileWidth'), item.data('tileHeight'), item)) {
                            item.opacity(1);
                            ige.$('outlineEntity').isFeasible = true;
                        }else{
                            item.opacity(0.5);
                            ige.$('outlineEntity').isFeasible = false;
                        }
                        // We are currently moving an item so update it's
                        // translation
                        var tx = tile.x + item._tileAdjustX;
                        var ty = tile.y + item._tileAdjustY;

                        item.translateToTile(tx, ty);
                        ige.$('outlineEntity').translateToTile(tile.x, tile.y);

                        // Store the last position we accepted
                        item.data('lastMoveX', tile.x);
                        item.data('lastMoveY', tile.y);
                    }
                });

                completeCallback();
            },
            exit: function (data, completeCallback) {
                var self = this,
                    tileMap = ige.$('tileMap1');

                ige.client.hideGrid('tileMap1');
                ige.$('outlineEntity').hide();

                $('#moveButton').unbind("click")
                    .click(function(){
                        clientSelf.fsm.enterState('move');
                    })
                $('#endMove').hide()

                clientSelf.mousePanStartHandler = ige.$('vp1').mousePan.on('panStart', function () {
                    clientSelf.fsm.enterState('pan');
                });
                clientSelf.mousePanEndHandler = ige.$('vp1').mousePan.on('panEnd', function () {
                    if (ige.client.isEditorOn !== undefined && ige.client.isEditorOn === true)
                        ige.client.fsm.enterState('editor');
                    else
                        clientSelf.fsm.enterState('select');
                });

                tileMap.off('mouseDown', self.mouseDownHandle);
                tileMap.off('mouseUp', self.mouseUpHandle);
                ige.$('vp1').off('mouseMove', self.mouseMoveHandle);

                if (ige.client.data('moveItem')) {
                    // We are moving a building, place this building
                    // down before changing state
                    var item = ige.client.data('moveItem'),
                        moveX = item.data('lastMoveX'),
                        moveY = item.data('lastMoveY');

                    item.moveTo(moveX, moveY);
                    // Clear the data
                    ige.client.data('moveItem', '');

                    ige.client.hideGrid('tileMap1');

                    API.updateObject(item, moveX, moveY)
                }
                completeCallback();
            }
        });

        this.fsm.defineState('editor', {
            enter: function (data, completeCallback) {
                vlg.log.info('entering state this.fsm.editor');
                // ClientHelpers.hideDialogs();

                dataLayer.push({'event': 'editor'});

                // Hook mouse events
                var self = this,
                    tileMap = ige.$('tileMapEditor');

                $("#topToolbar").hide();
                $("#notifyIconContainer").hide();

                ige.$('vp1')
                    .mousePan.enabled(true)
                    .scrollZoom.enabled(true)

                ige.$('outlineEntity').mount(ige.$('tileMapEditor'));

                self.mouseUpHandle = tileMap.on('mouseUp', function (event, evc, data) {
                    if (!ige.client.data('moveItem')) {
                        // We're not already moving an item so check if the user
                        // just clicked on a building
                        var tile = tileMap.mouseToTile(),
                            item = ige.client.itemAt('tileMapEditor', tile.x, tile.y);

                        if (item) {

                            // The user clicked on a building so set this as the
                            // building we are moving.
                            ige.client.data('moveItem', item);
                            ige.client.data('moveItemX', item.data('tileX'));
                            ige.client.data('moveItemY', item.data('tileY'));

                            //set initial position to lastmoveX-Y data
                            item.data('lastMoveX', item.data('tileX'));
                            item.data('lastMoveY', item.data('tileY'));

                            ige.$('outlineEntity').tileWidth = item.data('tileWidth');
                            ige.$('outlineEntity').tileHeight = item.data('tileHeight');
                            ige.$('outlineEntity').isFeasible = true;
                            ige.$('outlineEntity').translateToTile(item.data('tileX'), item.data('tileY'));

                            ige.client.showGrid('tileMapEditor');

                        }
                    } else {
                        // We are already moving a building, place this building
                        // down now
                        var item = ige.client.data('moveItem'),
                            moveX = item.data('lastMoveX'),
                            moveY = item.data('lastMoveY');

                        item.moveTo(moveX, moveY);
                        // Clear the data
                        ige.client.data('moveItem', '');

                        ige.client.hideGrid('tileMapEditor');

                        ige.client.editorManager.updateObject(item, moveX, moveY)
                    }
                });

                self.mouseMoveHandle = ige.$('vp1').on('mouseMove', function (event, evc, data) {
                    var item = ige.client.data('moveItem'),
                        map = tileMap.map,
                        tile = tileMap.mouseToTile();

                    if (item) {
                        var tileCenterX = item.data('tileWidth'), tileCenterY = item.data('tileHeight');

                        if (tileCenterX % 2 === 0)
                            tileCenterX -= 1;
                        if (tileCenterY % 2 === 0)
                            tileCenterY -= 1;

                        tile.x -= Math.floor(tileCenterX / 2);
                        tile.y -= Math.floor(tileCenterY / 2);

                        // Check if the current tile is in grid, and align if not
                        if(tile.x < 0)
                            tile.x = 0;

                        if(tile.y < 0)
                            tile.y = 0;

                        if(tile.x > ige.$('tileMapEditor').gridSize().x - item.data('tileWidth'))
                            tile.x = ige.$('tileMapEditor').gridSize().x - item.data('tileWidth');

                        if(tile.y > ige.$('tileMapEditor').gridSize().y - item.data('tileHeight'))
                            tile.y = ige.$('tileMapEditor').gridSize().y - item.data('tileHeight');

                        // Check if the current tile is occupied or not
                        if (!map.collision(tile.x, tile.y, item.data('tileWidth'), item.data('tileHeight')) || map.collisionWithOnly(tile.x, tile.y, item.data('tileWidth'), item.data('tileHeight'), item)) {
                            // We are currently moving an item so update it's
                            // translation
                            var tx = tile.x + item._tileAdjustX;
                            var ty = tile.y + item._tileAdjustY;

                            item.translateToTile(tx, ty);
                            ige.$('outlineEntity').translateToTile(tile.x, tile.y);

                            // Store the last position we accepted
                            item.data('lastMoveX', tile.x);
                            item.data('lastMoveY', tile.y);
                        }
                    }
                });

                completeCallback();
            },
            exit: function (data, completeCallback) {
                // Un-hook mouse events
                vlg.log.info('exiting state this.fsm.editor');

                var self = this,
                    tileMap = ige.$('tileMapEditor');

                if (tileMap) {
                    tileMap.off('mouseUp', self.mouseUpHandle);
                }
                ige.$('vp1').off('mouseMove', self.mouseMoveHandle);
                if (!ige.client.isEditorOn)
                    ige.client.editorManager = null;

                if (ige.client.data('moveItem')) {
                    // We are moving a building, place this building
                    // down before changing state
                    var item = ige.client.data('moveItem'),
                        moveX = item.data('lastMoveX'),
                        moveY = item.data('lastMoveY');

                    item.moveTo(moveX, moveY);
                    // Clear the data
                    ige.client.data('moveItem', '');

                    ige.client.hideGrid('tileMapEditor');

                    ige.client.editorManager.updateObject(item, moveX, moveY)
                }

                completeCallback();
            }
        });

        this.fsm.defineState('view', {
            enter: function (data, completeCallback) {
                vlg.log.info('entering state this.fsm.view');
                // ClientHelpers.hideDialogs();

                dataLayer.push({'event': 'view'});

                // Add base scene data
                ige.addGraph('IgeBaseScene');

                ige.$('vp1')
                    .addComponent(IgeMousePanComponent)
                    .addComponent(ScrollZoomComponent)
                    .addComponent(ScaleToPointComponent)
                    //.addComponent(PinchZoomComponent)
                    .addComponent(LimitZoomPanComponent, {
                        boundsX: 0,
                        boundsY: 0,
                        boundsWidth: parseInt(GameConfig.config['boundsWidth']),
                        boundsHeight: parseInt(GameConfig.config['boundsHeight'])
                    })

                    .mousePan.enabled(true)
                    .scrollZoom.enabled(true)
                    .autoSize(true)
                    .drawBounds(false) // Switch this to true to draw all bounding boxes
                    .drawBoundsData(false) // Switch this to true to draw all bounding boxes
                    .scene(ige.$('baseScene'))
                    .mount(ige);

                ige.addGraph('GraphView');
                ige.client.currentTileMap = ige.$("tileMapView");

                $("#topToolbar").hide();
                $("#notifyIconContainer").hide();

                $("#processingDialog").dialog({
                    resizable: false,
                    draggable: true,
                    dialogClass: 'ui-dialog-no-titlebar',
                    closeOnEscape: false,
                    width: 500,
                    height: 300,
                    modal: true,
                    autoOpen: false
                });
                $("#processingDialog").dialog("open");

                $("#processingContent")
                    .html("<div><p>Loading village, please wait!</p><p><img src='assets/textures/ui/loading_spinner.gif'></p></div>");

                $.ajax({
                    dataType: 'json',
                    url: '/api/village/' + ige.client.viewVillageID,
                    error: function (response) {
                        $("#processingContent")
                            .html("<div style='padding-top:80px'><p>There was an error contacting the server!<br />Please try again.</p>" +
                                "<p><button id='refreshPageButton'>Refresh</button></p></div>");

                        $('#refreshPageButton').on('click', function () {
                            location.reload();
                        });
                    },
                    success: function (response) {
                        if (response.viewable === "false") {
                            $("#processingContent")
                                .html("<div style='padding-top:80px'><p>Village is not viewable, sorry.</p></div>");
                            return;
                        }
                        $("#villageTitle").text(response.title)
                            .show()
                        for (var i = 0; i < response.data.length; i++) {
                            ClientHelpers.addObject(response.data[i], "tileMapView")
                            ige.$(response.data[i].id).mouseOverPanel.find(".objectInfoFooter").first().hide();
                        }
                        $("#processingDialog").dialog("close");
                    }
                })
                completeCallback();
            },
            exit: function (data, completeCallback) {
                vlg.log.info('exiting state this.fsm.view');

                completeCallback();
            }
        });

        this.fsm.defineState('tutorial', {
            enter: function (data, completeCallback) {
                vlg.log.info('entering state this.fsm.tutorial');
                // ClientHelpers.hideDialogs();

                dataLayer.push({'event': 'tutorial'});

                if(API.state.isTutorialShown !== true){
                    // start Level Music.
                    vlg.music['welcome'].fadeOut(0, 2000);
                    vlg.music['levelfull1'].fadeIn(1.0, 2000);
                }

                ige.$('vp1')
                    .mousePan.enabled(false)
                    .scrollZoom.enabled(false)
                    .camera.translateTo(0, 0, 0)
                    .camera.scaleTo(1.0, 1.0, 0);

                ige.$('level1').hide();
                ige.addGraph('GraphTutorial');
                $('#topToolbar').hide();
                $("#notifyIconContainer").hide();

                var topToolbarTutorial = $("#topToolbar").clone(true,true)
                $(topToolbarTutorial).find("[id]").add(topToolbarTutorial).each(function() {
                    this.id = this.id + "Tutorial";
                })
                topToolbarTutorial.insertAfter("#topToolbar");

                $('#topToolbarTutorial').children().hide();
                $('#topToolbarTutorial').children().unbind("click");
                $('#topToolbarTutorial').show();

                $('#cashbarProgressTutorial').progressbar("value",0);
                $('#cashbarProgressTutorial').text(0);
                $('#coinbarProgressTutorial').progressbar("value",parseInt(GameConfig.config['startCoins']));
                $('#coinbarProgressTutorial').text(parseInt(GameConfig.config['startCoins']));
                $('#waterbarProgressTutorial').progressbar("value",parseInt(GameConfig.config['startWater']));
                $('#waterbarProgressTutorial').text(parseInt(GameConfig.config['startWater']));

                self.tutorial = new Tutorial();
                self.tutorial.gotoStep('initialStep');

                completeCallback();
            },
            exit: function (data, completeCallback) {
                vlg.log.info('exiting state this.fsm.tutorial');

                ige.$('level1').show();
                ige.removeGraph('GraphTutorial');

                $('#topToolbarTutorial').remove();
                $("#topToolbar").show();
                $("#notifyIconContainer").show();

                self.tutorial = null;

                self.eventEmitter = self.eventEmitter || new EventEmitter()
                self.gameLogic = self.gameLogic || new GameLogic()

                API.setTutorialAsShown();

                completeCallback();
            }
        });

        this.fsm.defineState('marketDialog', {
            enter: function (data, completeCallback) {
                vlg.log.info('entering state this.fsm.marketDialog');
                dataLayer.push({'event': 'marketDialog'});
                $( "#marketDialog" ).closest('div.ui-dialog').find('div.ui-dialog-titlebar')
                    .addClass("marketDialogHeader");
                completeCallback();
            },
            exit: function (data, completeCallback) {
                vlg.log.info('exiting state this.fsm.marketDialog');
                ige.$("marketDialog").hide()
                completeCallback();
            }
        });

        this.fsm.defineState('editorMarketDialog', {
            enter: function (data, completeCallback) {
                vlg.log.info('entering state this.fsm.editorMarketDialog');
                dataLayer.push({'event': 'editorMarketDialog'});
                completeCallback();
            },
            exit: function (data, completeCallback) {
                vlg.log.info('exiting state this.fsm.editorMarketDialog');

                completeCallback();
            }
        });

        this.fsm.defineState('cashDialog', {
            enter: function (data, completeCallback) {
                vlg.log.info('entering state this.fsm.cashDialog');
                dataLayer.push({'event': 'cashDialog'});
                $( "#cashBuyDialog" ).closest('div.ui-dialog').find('div.ui-dialog-titlebar')
                    .addClass("cashBuyDialogHeader");
                completeCallback();
            },
            exit: function (data, completeCallback) {
                vlg.log.info('exiting state this.fsm.cashDialog');
                ige.$("cashDialog").hide()
                completeCallback();
            }
        });

        this.fsm.defineState('coinDialog', {
            enter: function (data, completeCallback) {
                vlg.log.info('entering state this.fsm.coinDialog');
                dataLayer.push({'event': 'coinDialog'});
                $( "#coinBuyDialog" ).closest('div.ui-dialog').find('div.ui-dialog-titlebar')
                    .addClass("coinBuyDialogHeader");
                completeCallback();
            },
            exit: function (data, completeCallback) {
                vlg.log.info('exiting state this.fsm.coinDialog');
                ige.$("coinDialog").hide()
                completeCallback();
            }
        });

        this.fsm.defineState('waterDialog', {
            enter: function (data, completeCallback) {
                vlg.log.info('entering state this.fsm.waterDialog');
                dataLayer.push({'event': 'waterDialog'});
                $( "#waterBuyDialog" ).closest('div.ui-dialog').find('div.ui-dialog-titlebar')
                    .addClass("waterBuyDialogHeader");
                completeCallback();
            },
            exit: function (data, completeCallback) {
                vlg.log.info('exiting state this.fsm.waterDialog');
                ige.$("waterDialog").hide()
                completeCallback();
            }
        });

        this.fsm.defineState('goalDialog', {
            enter: function (data, completeCallback) {
                vlg.log.info('entering state this.fsm.goalDialog');
                dataLayer.push({'event': 'goalDialog'});
                completeCallback();
            },
            exit: function (data, completeCallback) {
                vlg.log.info('exiting state this.fsm.goalDialog');
                $( "#goalDialog" ).dialog({close: function( event, ui ) {}});
                $( "#goalDialog" ).dialog( "close" );

                completeCallback();
            }
        });

        this.fsm.defineState('buyConfirmDialog', {
            enter: function (data, completeCallback) {
                vlg.log.info('entering state this.fsm.buyConfirmDialog');
                dataLayer.push({'event': 'buyConfirmDialog'});
                completeCallback();
            },
            exit: function (data, completeCallback) {
                vlg.log.info('exiting state this.fsm.buyConfirmDialog');
                $("#buyConfirmYes").unbind("click");
                $("#buyConfirmNo").unbind("click");
                $("#buyConfirmOK").unbind("click");
                $( "#buyConfirmDialog" ).dialog({close: function( event, ui ) {}});
                $( "#buyConfirmDialog" ).dialog( "close" );
                if(ige.client.newBuyConfirm){
                    ige.client.newBuyConfirm.destroy();
                    ige.client.newBuyConfirm = null;
                }
                completeCallback();
            }
        });

        this.fsm.defineState('showMessage', {
            enter: function (data, completeCallback) {
                var self = this;
                dataLayer.push({'event': 'showMessage'});
                vlg.log.info('entering state this.fsm.showMessage');

                self.messageDialog = new MessageDialog(data.title, data.message, data.callback)
                    .layer(1)
                    .show()
                    .mount(ige.$('uiScene'));

                completeCallback();
            },
            exit: function (data, completeCallback) {
                var self = this;

                vlg.log.info('exiting state this.fsm.showMessage');

                $("#messageDialogOK").unbind("click");
                if(self.messageDialog){
                    if(!self.messageDialog.isHidden())
                        self.messageDialog.hide();
                    if(self.messageDialog.callback !== null && self.messageDialog.callback !== undefined){
                        self.messageDialog.callback();
                        self.messageDialog.callback = null;
                    }
                    self.messageDialog.destroy();
                    self.messageDialog = null;
                }

                completeCallback();
            }
        });

        this.fsm.defineState('playerMenu', {
            enter: function (data, completeCallback) {
                vlg.log.info('entering state this.fsm.playerMenu');
                dataLayer.push({'event': 'playerMenu'});
                self.slideRight.open();
                completeCallback();
            },
            exit: function (data, completeCallback) {
                vlg.log.info('exiting state this.fsm.playerMenu');
                self.slideRight.close();
                completeCallback();
            }
        });

        this.fsm.defineState('shareMyVillage', {
            enter: function (data, completeCallback) {
                vlg.log.info('entering state this.fsm.shareMyVillage');
                dataLayer.push({'event': 'shareMyVillage'});
                $( "#shareMyVillageDialog" ).dialog({ resizable: false, draggable: true, closeOnEscape: false, close: function( event, ui ) {ige.client.fsm.enterState('select')}, width: 500, height: 300, modal: true, autoOpen: false });
                $( "#shareMyVillageDialog" ).dialog( "open" );

                $( "#shareMyVillageContent" )
                    .html( '<div style="padding-top:45px"><p>Share My Village:</p><div><textarea id="shareMyVillageTextArea" style="width:428px;"></textarea>' +
                    '<div id="shareMyVillageErrorField" class="ui-state-error" style="display:none;font-size:14px;">Your browser doesn\'t support copying. Please copy manually</div>' +
                    '<button id="copyMyVillageClipboardButton">Copy to Clipboard</button></div></div>' );

                var url = window.location.href;
                var arr = url.split("/");
                var result = arr[0] + "//" + arr[2]
                $('#shareMyVillageTextArea').val(result + '/view/' + API.user.key_id);

                $('#copyMyVillageClipboardButton').on('click', function(){
                    var copyTextarea = $('#shareMyVillageTextArea');
                    copyTextarea.select();

                    try {
                        var successful = document.execCommand('copy');
                        var msg = successful ? 'successful' : 'unsuccessful';
                        console.log('Copying text command was ' + msg);
                        if(!successful){
                            $('#shareMyVillageErrorField').css('display','')
                        }
                    } catch (err) {
                        console.log('Oops, unable to copy');
                        $('#shareMyVillageErrorField').css('display','')
                    }
                });
                completeCallback();
            },
            exit: function (data, completeCallback) {
                vlg.log.info('exiting state this.fsm.shareMyVillage');
                $( "#shareMyVillageDialog" ).dialog({close: function( event, ui ) {}});
                $( "#shareMyVillageDialog" ).dialog( "close" );
                completeCallback();
            }
        });

        this.fsm.defineState('feedbackDialog', {
            enter: function (data, completeCallback) {
                vlg.log.info('entering state this.fsm.feedbackDialog');
                dataLayer.push({'event': 'feedbackDialog'});

                $( "#feedBackDialog" ).dialog({ resizable: false, draggable: true, closeOnEscape: false, width: 600, height: 'auto', modal: true, autoOpen: false, close: function( event, ui ) {ige.client.fsm.enterState('select');} });
                $( "#feedBackDialog" ).dialog( "open" );

                $( "#contact-submit" ).click(function(){
                    if(!$('#contactName')[0].checkValidity() || !$('#contactEmail')[0].checkValidity() || !$('#contactMessage')[0].checkValidity())
                        return;
                    $( this ).hide();
                    $( "#contactSending").show();
                    $.ajax({
                        url: '/sendfeedback',
                        dataType: 'json',
                        method: 'POST',
                        async: true,
                        data: JSON.stringify({name: $( "#contactName").val(),
                            email: $( "#contactEmail").val(),
                            message: $( "#contactMessage").val()}),
                        success: function(result){
                            new BuyConfirm(result.message,null,true)
                                .layer(1)
                                .show()
                                .mount(ige.$('uiScene'));
                        }
                    })
                })
                completeCallback();
            },
            exit: function (data, completeCallback) {
                vlg.log.info('exiting state this.fsm.feedbackDialog');
                $( "#feedBackDialog" ).dialog({close: function( event, ui ) {}});
                $( "#feedBackDialog" ).dialog( "close" );
                $( "#contactName" ).val("");
                $( "#contactEmail" ).val("");
                $( "#contactMessage" ).val("");
                $( "#contactSending" ).hide();
                $( "#contact-submit" ).show()
                    .unbind("click");

                completeCallback();
            }
        });

        this.fsm.defineState('login', {
            enter: function (data, completeCallback) {
                vlg.log.info('entering state this.fsm.login');
                dataLayer.push({'event': 'login'});
                $( "#processingDialog" ).dialog({ resizable: false, draggable: true, dialogClass: 'ui-dialog-no-titlebar', closeOnEscape: false, width: 500, height: 300, modal: true, autoOpen: false });
                $( "#processingDialog" ).closest('div.ui-dialog').find('button.ui-dialog-titlebar-close').hide();
                $( "#processingDialog" ).dialog( "open" );

                $( "#processingContent" )
                    .html( "<div><p>Signing in, please wait!</p><p><img src='assets/textures/ui/loading_spinner.gif'></p></div>" );

                ige.client.gameLogic.loginManager.login();
                completeCallback();
            },
            exit: function (data, completeCallback) {
                vlg.log.info('exiting state this.fsm.login');
                $( "#processingDialog" ).dialog( "close" );
                completeCallback();
            }
        });

        this.fsm.defineState('logout', {
            enter: function (data, completeCallback) {
                vlg.log.info('entering state this.fsm.logout');
                dataLayer.push({'event': 'logout'});
                $( "#processingDialog" ).dialog({ resizable: false, draggable: true, dialogClass: 'ui-dialog-no-titlebar', closeOnEscape: false, width: 500, height: 300, modal: true, autoOpen: false });
                $( "#processingDialog" ).closest('div.ui-dialog').find('button.ui-dialog-titlebar-close').hide();
                $( "#processingDialog" ).dialog( "open" );

                $( "#processingContent" )
                    .html( "<div><p>Signing out, please wait!</p><p><img src='assets/textures/ui/loading_spinner.gif'></p></div>" );

                ige.client.gameLogic.loginManager.logout();
                completeCallback();
            },
            exit: function (data, completeCallback) {
                vlg.log.info('exiting state this.fsm.logout');
                $( "#processingDialog" ).dialog( "close" );
                completeCallback();
            }
        });

        this.fsm.defineState('reloadGame', {
            enter: function (data, completeCallback) {
                vlg.log.info('entering state this.fsm.reloadGame');
                dataLayer.push({'event': 'reloadGame'});
                $( "#processingDialog" ).dialog({ resizable: false, draggable: true, dialogClass: 'ui-dialog-no-titlebar', closeOnEscape: false, width: 500, height: 300, modal: true, autoOpen: false });
                $( "#processingDialog" ).closest('div.ui-dialog').find('button.ui-dialog-titlebar-close').hide();
                $( "#processingDialog" ).dialog( "open" );

                $( "#processingContent" )
                    .html( "<div><p>Loading village, please wait!</p><p><img src='assets/textures/ui/loading_spinner.gif'></p></div>" );

                for(var i = 1; i <= ige.$('marketDialog')._pageCount; i++){
                    $('#marketDialogPage' + i).remove();
                }
                $('#marketDialogPagination').jqPagination('destroy');
                $('#marketDialogPagination').find('input').data('current-page',1);
                $('.notifyIconContainer').empty();
                var tempElem = $('#objectInfoPanelTemplate');
                $('#objectInfoContainer').empty();
                $('#objectInfoContainer').append(tempElem);

                history.replaceState({'villageID':'none'},"load_village",location.href.split("?")[0]);

                ige.client.viewVillageID = null;
                ige.client.eventEmitter = null;
                ige.client.gameLogic = null;
                ige.removeGraph('GraphLevel1');
                ige.removeGraph('GraphUi');

                API.state = {coins: parseInt(GameConfig.config['startCoins']), cash: parseInt(GameConfig.config['startCash']), water: parseInt(GameConfig.config['startWater']), isTutorialShown: true };
                API.stateObjectsLookup = {};
                API.stateGoalsLookup = {};
                API.user = null;
                API.loginStatus = "offline";

                function postinit(){
                    // Add level1 graph
                    ige.addGraph('GraphLevel1');
                    ige.client.currentTileMap = ige.$("tileMap1");

                    // Add ui graph
                    ige.addGraph('GraphUi');

                    new Villager()
                        .id('bob')
                        .mount(ige.$('tileMap1'))

                    dataLayer.push({'event': 'gameReload'});
                }

                API.init(postinit);

                completeCallback();
            },
            exit: function (data, completeCallback) {
                vlg.log.info('exiting state this.fsm.reloadGame');
                $( "#processingDialog" ).dialog( "close" );
                completeCallback();
            }
        });

        var clientSelf = this;

        this.fsm.defineState('build', {
            enter: function (data, completeCallback) {
                vlg.log.info('entering state this.fsm.build');
                dataLayer.push({'event': 'build'});
                var self = this,
                    tileMap = ige.$('tileMap1');

                // Create a new instance of the object we are going to build
                ige.client.cursorObject = new ige.newClassInstance(data.classId)
                    .mount(ige.$('tileMap1'))
                    .layer(24);
                var cursorClassId = data.classId

                ige.client.cursorObjectData = data;

                var objectTileWidth = ige.client.cursorObject.xTiles,
                    objectTileHeight = ige.client.cursorObject.yTiles;

                ige.client.cursorObject.data('tileWidth', objectTileWidth)
                    .data('tileHeight', objectTileHeight);

                ige.$('outlineEntity').mount(ige.$('tileMap1'))
                ige.$('outlineEntity').tileWidth = objectTileWidth;
                ige.$('outlineEntity').tileHeight = objectTileHeight;

                ige.client.showGrid('tileMap1');

                // Hook mouse events
                self.mouseMoveHandle = ige.$('vp1').on('mouseMove', function (event, evc, data) {
                    var tile = tileMap.mouseToTile(),
                        tileCenterX = objectTileWidth, tileCenterY = objectTileHeight;

                    if (tileCenterX % 2 === 0)
                        tileCenterX -= 1;
                    if (tileCenterY % 2 === 0)
                        tileCenterY -= 1;

                    tile.x -= Math.floor(tileCenterX / 2);
                    tile.y -= Math.floor(tileCenterY / 2);

                    // Check if the current tile is in grid, and align if not
                    if(tile.x < 0)
                        tile.x = 0;

                    if(tile.y < 0)
                        tile.y = 0;

                    if(tile.x > ige.$('tileMap1').gridSize().x - ige.client.cursorObject.xTiles)
                        tile.x = ige.$('tileMap1').gridSize().x - ige.client.cursorObject.xTiles;

                    if(tile.y > ige.$('tileMap1').gridSize().y - ige.client.cursorObject.yTiles)
                        tile.y = ige.$('tileMap1').gridSize().y - ige.client.cursorObject.yTiles;

                    // Check that the tiles this object will occupy if moved are
                    // not already occupied
                    var isFree = !tileMap.isTileOccupied(
                        tile.x,
                        tile.y,
                        objectTileWidth,
                        objectTileHeight);
                    ige.client.cursorObject.opacity(isFree ? 1 : 0.5);
                    ige.$('outlineEntity').isFeasible = isFree;
                    // Move our cursor object to the tile
                    var tx = tile.x + ige.client.cursorObject._tileAdjustX;
                    var ty = tile.y + ige.client.cursorObject._tileAdjustY;
                    ige.client.cursorObject.translateToTile(tx, ty);
                    ige.$('outlineEntity').translateToTile(tile.x, tile.y);
                    self.cursorTile = tile;
                });

                self.mouseUpHandle = tileMap.on('mouseUp', function (event, evc, data) {
                    var objectTileWidth = ige.client.cursorObject.xTiles,
                        objectTileHeight = ige.client.cursorObject.yTiles,
                        player = ige.$('bob'),
                        playerTile = player.currentTile(),
                        tile = tileMap.mouseToTile(),
                        tileCenterX = objectTileWidth, tileCenterY = objectTileHeight;

                    if (tileCenterX % 2 === 0)
                        tileCenterX -= 1;
                    if (tileCenterY % 2 === 0)
                        tileCenterY -= 1;

                    tile.x -= Math.floor(tileCenterX / 2);
                    tile.y -= Math.floor(tileCenterY / 2);

                    // Check if the current tile is in grid, and align if not
                    if(tile.x < 0)
                        tile.x = 0;

                    if(tile.y < 0)
                        tile.y = 0;

                    if(tile.x > ige.$('tileMap1').gridSize().x - ige.client.cursorObject.xTiles)
                        tile.x = ige.$('tileMap1').gridSize().x - ige.client.cursorObject.xTiles;

                    if(tile.y > ige.$('tileMap1').gridSize().y - ige.client.cursorObject.yTiles)
                        tile.y = ige.$('tileMap1').gridSize().y - ige.client.cursorObject.yTiles;

                    ige.client.hideGrid('tileMap1');

                    if (tileMap.isTileOccupied(
                            tile.x,
                            tile.y,
                            objectTileWidth,
                            objectTileHeight)) {

                        ige.client.cursorObject.destroy();
                        ige.client.cursorObject = null;
                        ige.client.cursorObjectData = null;

                        clientSelf.fsm.enterState('select')

                        return;
                    }

                    // Reduce the coins progress bar by the cost
                    if (!API.reduceAssets(
                            {
                                coins: parseInt(ige.client.cursorObjectData.coins, 10),
                                cash: parseInt(ige.client.cursorObjectData.cash, 10)
                            }).status) {
                        // Not enough money?
                        mixpanel.track("Not enough money");
                        ige.client.cursorObject.destroy();
                        ige.client.cursorObject = null;
                        ige.client.cursorObjectData = null;

                        var message = GameConfig.config['notEnoughCoinsString'];

                        var cashDialog = new BuyConfirm(message,
                            function () {
                                ige.$('coinDialog').show();
                            })
                            .layer(1)
                            .show()
                            .mount(ige.$('uiScene'));

                        return;
                    }

                    dataLayer.push({'event': 'gameObjectBuild'});
                    // Play the audio
                    // ige.client.audio.monster_footstep.play();
                    vlg.sfx['build'].play();


                    // Build the cursorObject by releasing it from our control
                    // and switching state
                    ige.client.cursorObject.occupyTile(
                        self.cursorTile.x,
                        self.cursorTile.y,
                        objectTileWidth,
                        objectTileHeight
                    );

                    ige.client.cursorObject.data('tileX', self.cursorTile.x)
                        .data('tileY', self.cursorTile.y)
                        .data('tileWidth', objectTileWidth)
                        .data('tileHeight', objectTileHeight);

                    var objinfo = {
                        id: ige.client.cursorObject.id(),
                        x: self.cursorTile.x,
                        y: self.cursorTile.y,
                        w: objectTileWidth,
                        h: objectTileHeight,
                        name: cursorClassId,
                        buildStarted: Date.now(),
                        currentState: "building"
                    }

                    ige.client.cursorObject._buildStarted = objinfo.buildStarted;

                    API.createObject(objinfo)

                    // Grab the point the entity is at before we animate it
                    var buildPoint = ige.client.cursorObject._translate.toIso();

                    // Tween the object to the position by "bouncing" it
                    ige.client.cursorObject
                        .layer(5)
                        .translate().z(100)
                        ._translate.tween(
                        {z: 0},
                        1000,
                        {easing: 'outBounce'}
                    ).start();

                    // Set initial state of object by calling the place() method
                    ige.client.cursorObject.currentState = "building"
                    ige.client.cursorObject.place();

                    //we don't need a coin animation and particle effect for zero coin
                    if (ige.client.cursorObjectData.coins > 0) {
                        // Create a cash value rising from placement that fades out
                        var coinAnim;

                        coinAnim = new IgeEntity()
                            .layer(10)
                            .texture(ige.client.textures.coin)
                            .dimensionsFromCell()
                            .scaleTo(1, 1, 1)
                            .translateToPoint(buildPoint)
                            .translateBy(-10, -50, 0)
                            .mount(ige.$('tileMap1'));

                        new IgeFontEntity()
                            .layer(2)
                            .textAlignX(0)
                            .colorOverlay('#ffffff')
                            .nativeFont('12px Verdana')
                            .textLineSpacing(0)
                            .text('-' + ige.client.cursorObjectData.coins)
                            .width(45)
                            .center(28)
                            .mount(coinAnim);

                        coinAnim
                            ._translate.tween(
                            {y: buildPoint.y - 100},
                            2000
                        )
                            .start(200);

                        coinAnim.tween(
                            {_opacity: 0},
                            2000,
                            {easing: 'inQuad'}
                        )
                            .afterTween(function () {
                                coinAnim.destroy();
                            })
                            .start(200);

                        // Play the coin particle effect
                        ige.$('coinEmitter')
                            .quantityMax(parseInt(ige.client.cursorObjectData.coins, 10))
                            .start();
                    }

                    ige.client.eventEmitter.emit('build', {
                        "id": cursorClassId,
                        "type": ige.client.cursorObject.type,
                        "unlocks": ige.client.cursorObject.unlocks,
                        "callback" : function(){
                            // Remove reference to the object
                            ige.client.cursorObject = null;
                            ige.client.cursorObjectData = null;
                        }
                    })

                    // Check if the tile we are standing on is occupied now
                    if (ige.$('tileMap1').isTileOccupied(playerTile.x, playerTile.y, 1, 1)) {
                        // Move our player away from the tile
                        ige.$('bob').walkToTile(playerTile.x + 1, playerTile.y - 1);
                    } else {
                        // Move the player to the building
                        ige.$('bob').walkToTile(self.cursorTile.x, self.cursorTile.y);
                    }
                });

                completeCallback();
            },
            exit: function (data, completeCallback) {
                vlg.log.info('exiting state this.fsm.build');

                // Clear our mouse listeners
                var self = this,
                    tileMap = ige.$('tileMap1');

                tileMap.off('mouseUp', self.mouseUpHandle);
                ige.$('vp1').off('mouseMove', self.mouseMoveHandle);

                ige.client.hideGrid('tileMap1');

                if (ige.client.cursorObject) {
                    ige.client.cursorObject.destroy();
                    delete ige.client.cursorObject;
                }

                completeCallback();
            }
        });

        this.fsm.defineState('editorBuild', {
            enter: function (data, completeCallback) {
                vlg.log.info('entering state this.fsm.editorBuild');
                // ClientHelpers.hideDialogs();
                dataLayer.push({'event': 'editorBuild'});
                var self = this,
                    tileMap = ige.$('tileMapEditor'),
                    cursorClassId = data.classId,
                    objectTileWidth, objectTileHeight;

                ige.client.createNewCursorObject(data);

                objectTileWidth = ige.client.cursorObject.xTiles;
                objectTileHeight = ige.client.cursorObject.yTiles;

                ige.client.showGrid('tileMapEditor');

                // Hook mouse events
                self.mouseMoveHandle = ige.$('vp1').on('mouseMove', function (event, evc, data) {
                    var tile = tileMap.mouseToTile(),
                        tileCenterX = objectTileWidth, tileCenterY = objectTileHeight;

                    if (tileCenterX % 2 === 0)
                        tileCenterX -= 1;
                    if (tileCenterY % 2 === 0)
                        tileCenterY -= 1;

                    tile.x -= Math.floor(tileCenterX / 2);
                    tile.y -= Math.floor(tileCenterY / 2);

                    // Check if the current tile is in grid, and align if not
                    if(tile.x < 0)
                        tile.x = 0;

                    if(tile.y < 0)
                        tile.y = 0;

                    if(tile.x > ige.$('tileMapEditor').gridSize().x - ige.client.cursorObject.xTiles)
                        tile.x = ige.$('tileMapEditor').gridSize().x - ige.client.cursorObject.xTiles;

                    if(tile.y > ige.$('tileMapEditor').gridSize().y - ige.client.cursorObject.yTiles)
                        tile.y = ige.$('tileMapEditor').gridSize().y - ige.client.cursorObject.yTiles;

                    // Check that the tiles this object will occupy if moved are
                    // not already occupied
                    var isFree = !tileMap.isTileOccupied(
                        tile.x,
                        tile.y,
                        objectTileWidth,
                        objectTileHeight);
                    ige.client.cursorObject.opacity(isFree ? 1 : 0.5);
                    ige.$('outlineEntity').isFeasible = isFree;
                    // Move our cursor object to the tile
                    var tx = tile.x + ige.client.cursorObject._tileAdjustX;
                    var ty = tile.y + ige.client.cursorObject._tileAdjustY;
                    ige.client.cursorObject.translateToTile(tx, ty);
                    ige.$('outlineEntity').translateToTile(tile.x, tile.y);
                });

                self.mouseUpHandle = tileMap.on('mouseUp', function (event, evc, data) {
                    var tile = tileMap.mouseToTile(),
                        tileCenterX = objectTileWidth, tileCenterY = objectTileHeight;

                    if (tileCenterX % 2 === 0)
                        tileCenterX -= 1;
                    if (tileCenterY % 2 === 0)
                        tileCenterY -= 1;

                    tile.x -= Math.floor(tileCenterX / 2);
                    tile.y -= Math.floor(tileCenterY / 2);

                    // Check if the current tile is in grid, and align if not
                    if(tile.x < 0)
                        tile.x = 0;

                    if(tile.y < 0)
                        tile.y = 0;

                    if(tile.x > ige.$('tileMapEditor').gridSize().x - ige.client.cursorObject.xTiles)
                        tile.x = ige.$('tileMapEditor').gridSize().x - ige.client.cursorObject.xTiles;

                    if(tile.y > ige.$('tileMapEditor').gridSize().y - ige.client.cursorObject.yTiles)
                        tile.y = ige.$('tileMapEditor').gridSize().y - ige.client.cursorObject.yTiles;

                    if (tileMap.isTileOccupied(
                            tile.x,
                            tile.y,
                            objectTileWidth,
                            objectTileHeight)) {

                        return;
                    }

                    // Play the audio
                    // ige.client.audio.monster_footstep.play();
                    vlg.sfx['build'].play();


                    // Build the cursorObject by releasing it from our control
                    // and switching state
                    ige.client.cursorObject.occupyTile(
                        tile.x,
                        tile.y,
                        objectTileWidth,
                        objectTileHeight
                    );

                    ige.client.cursorObject.data('tileX', tile.x)
                        .data('tileY', tile.y)
                        .data('tileWidth', objectTileWidth)
                        .data('tileHeight', objectTileHeight);

                    var objinfo = {
                        id: ige.client.cursorObject.id(),
                        x: tile.x,
                        y: tile.y,
                        w: objectTileWidth,
                        h: objectTileHeight,
                        name: cursorClassId,
                        buildStarted: Date.now(),
                        buildCompleted: Date.now()
                    }

                    ige.client.cursorObject._buildStarted = objinfo.buildStarted;
                    ige.client.cursorObject._buildCompleted = objinfo.buildCompleted;

                    ige.client.editorManager.createObject(objinfo)

                    // Set initial state of object by calling the place() method
                    ige.client.cursorObject.place(true);

                    // Remove reference to the object
                    ige.client.cursorObject = null;

                    //Continue with new cursor object
                    ige.client.createNewCursorObject(ige.client.cursorObjectData)
                });

                completeCallback();
            },
            exit: function (data, completeCallback) {
                vlg.log.info('exiting state this.fsm.build');

                // Clear our mouse listeners
                var self = this,
                    tileMap = ige.$('tileMapEditor');

                if (tileMap) {
                    tileMap.off('mouseUp', self.mouseUpHandle);
                }
                ige.$('vp1').off('mouseMove', self.mouseMoveHandle);
                ige.client.hideGrid('tileMapEditor');

                if (ige.client.cursorObject) {
                    ige.client.cursorObject.destroy();
                    delete ige.client.cursorObject;
                }

                completeCallback();
            }
        });

        this.fsm.defineState('editorDelete', {
            enter: function (data, completeCallback) {
                vlg.log.info('entering state this.fsm.editorDelete');
                // ClientHelpers.hideDialogs();
                dataLayer.push({'event': 'editorDelete'});
                // Hook mouse events
                var self = this,
                    tileMap = ige.$('tileMapEditor');

                var mp = ige.$('uiSceneEditor').mousePos();

                ige.client.deleteCursorObject = new IgeEntity()
                    .texture(ige.client.textures.xbutton)
                    .isometric(false)
                    .dimensionsFromTexture()
                    .mount(ige.$('uiSceneEditor'))
                    .translateTo(mp.x, mp.y, 0);

                self.mouseMoveHandle = ige.$('vp1').on('mouseMove', function (event, evc, data) {
                    // $('#igeFrontBuffer').css("cursor", "none");
                    var mp = ige.$('uiSceneEditor').mousePos();
                    ige.client.deleteCursorObject.translateTo(mp.x, mp.y, 0);
                });
                self.mouseUpHandle = tileMap.on('mouseUp', function (event, evc, data) {
                    // check if the user
                    // just clicked on a building
                    var tile = tileMap.mouseToTile(),
                        item = ige.client.itemAt('tileMapEditor', tile.x, tile.y);

                    if (item) {
                        item.unOccupyTile(
                            item.data('tileX'),
                            item.data('tileY'),
                            item.data('tileWidth'),
                            item.data('tileHeight')
                        );

                        item.destroy();
                        ige.client.editorManager.deleteObject(item);
                    }
                });

                completeCallback();
            },
            exit: function (data, completeCallback) {
                vlg.log.info('exiting state this.fsm.editorDelete');


                var self = this,
                    tileMap = ige.$('tileMapEditor');

                // $('#igeFrontBuffer').css("cursor", "default");

                if (tileMap) {
                    tileMap.off('mouseUp', self.mouseUpHandle);
                }
                ige.$('vp1').off('mouseMove', self.mouseMoveHandle);

                ige.client.deleteCursorObject.destroy();
                ige.client.deleteCursorObject = null;

                completeCallback();
            }
        });

        this.fsm.defineState('pan', {
            enter: function (data, completeCallback) {
                vlg.log.info('entering state this.fsm.pan');
                // ClientHelpers.hideDialogs();
                dataLayer.push({'event': 'pan'});
                completeCallback();
            },
            exit: function (data, completeCallback) {
                vlg.log.info('exiting state this.fsm.pan');

                completeCallback();
            }
        });

        this.fsm.defineTransition('build', 'marketDialog', function (data, callback) {
            // Ensure that the item we were building is removed because
            // it was not placed
            if (ige.client.cursorObject) {
                ige.client.cursorObject.destroy();
                delete ige.client.cursorObject;
            }

            // Callback with no error
            callback(false);
        });

        var combinedPromise = $.when(getGameCatalog(), getGameEarnings(), getGameProblems(), getGameGoals(), getGameAssets(), getDropDownMenu(), getSpecialEvents())
        // function will be called when getGameCatalog, getGameEarnings, getGameGoals and getGameAssets resolve
        combinedPromise.done(function (gameCatalogData, gameEarningsData, gameProblemsData, gameGoalsData, gameAssetsData, gameDropDownMenuData, gameSpecialEvents) {
            // Load game audio and textures
            var checkAssetImages, checkGameObjectImages, createTextures,
                assetIndex = 0, gameObjectIndex = 0,
                gameObjectTexturesKeys = [];

            for (var key in GameObjects.gameObjectTextures) {
                gameObjectTexturesKeys.push(key);
            }

            checkAssetImages = function(assetIndex){
                $.ajax({
                    type: "HEAD",
                    async: true,
                    url: GameAssets.assets[assetIndex].url
                }).done(function(message,text,jqXHR){
                    assetIndex++;
                    if(assetIndex === GameAssets.assets.length){
                        checkGameObjectImages(gameObjectIndex);
                        return;
                    }
                    checkAssetImages(assetIndex);
                }).fail(function(message,text,jqXHR){
                    if(GameAssets.assets[assetIndex].type !== "Audio")
                        GameAssets.assets[assetIndex].url = GameConfig.config['notFoundImageURL'];
                    assetIndex++;
                    if(assetIndex === GameAssets.assets.length){
                        checkGameObjectImages(gameObjectIndex);
                        return;
                    }
                    checkAssetImages(assetIndex);
                });
            }

            checkGameObjectImages = function(gameObjectIndex){
                $.ajax({
                    type: "HEAD",
                    async: true,
                    url: GameObjects.gameObjectTextures[gameObjectTexturesKeys[gameObjectIndex]][0]
                }).done(function(message,text,jqXHR){
                    gameObjectIndex++;
                    if(gameObjectIndex === gameObjectTexturesKeys.length){
                        createTextures();
                        return;
                    }
                    checkGameObjectImages(gameObjectIndex);
                }).fail(function(message,text,jqXHR){
                    GameObjects.gameObjectTextures[gameObjectTexturesKeys[gameObjectIndex]][0] = GameConfig.config['notFoundImageURL'];
                    gameObjectIndex++;
                    if(gameObjectIndex === gameObjectTexturesKeys.length){
                        createTextures();
                        return;
                    }
                    checkGameObjectImages(gameObjectIndex);
                });
            }

            createTextures = function(){
                for (var i = 0; i < GameAssets.assets.length; i++) {
                    if (GameAssets.assets[i].enabled === "FALSE")
                        continue;
                    var asset = GameAssets.assets[i]
                    if (asset.type === "CellSheet")
                        self[asset.attachTo][asset.name] = new IgeCellSheet(asset.url, parseInt(asset.horizontalCells), parseInt(asset.verticalCells));
                    else if (asset.type === "Audio")
                        continue;
                    // working through moving Audio to outside Ige entirely.
                    //self[asset.attachTo][asset.name] = new IgeAudio(asset.url);
                    else if (asset.type === "Texture")
                        self[asset.attachTo][asset.name] = new IgeTexture(asset.url);
                    else if (asset.type === "FontSheet")
                        self[asset.attachTo][asset.name] = new IgeFontSheet(asset.url);
                }
                for (var key in GameObjects.gameObjectTextures) {
                    var tex = GameObjects.gameObjectTextures[key]
                    self.textures[key] = new IgeCellSheet(tex[0], tex[1], 1)
                }
            }

            checkAssetImages(assetIndex);
        });

        combinedPromise.fail(function () {
            alert('Game does not load at the moment. Please try again later.')
        });

        ige.ui.style('.dialog', {
            left: 0,
            right: 0,
            top: 0,
            bottom: 0
        });

        ige.ui.style('.underlay', {
            backgroundColor: '#000000',
            opacity: 0.6,
            left: 0,
            right: 0,
            top: 0,
            bottom: 0
        });

        // Wait for our textures to load before continuing
        ige.on('texturesLoaded', function () {
            // Create the HTML canvas
            if (true) {
                ige.createFrontBuffer(true);
            } else {
                var canvas = $('<canvas id=gameCanvas>').appendTo('body')
                var width = parseInt(GameConfig.config['canvasWidth']) * gameScale
                var height = parseInt(GameConfig.config['canvasHeight']) * gameScale
                canvas.attr('width', width)
                canvas.attr('height', height)
                var baseSize = Math.min($(window).width() / width, $(window).height() / height)
                canvas.width(width * baseSize)
                canvas.height(height * baseSize)
                // canvas.css({
                //     position: 'absolute',
                //     left: ($(window).width() - width * baseSize) / 2,
                //     top: ($(window).height() - height * baseSize) / 2
                // })
                // $('body').css('background-color', '#407c03')
            }

            ige.canvas(document.getElementById('gameCanvas'));

            // Start the engine
            ige.start(function (success) {
                // Check if the engine started successfully
                function postinit(isTutorialShown) {
                    // Add base scene data
                    ige.addGraph('IgeBaseScene');

                    // Add level1 graph
                    ige.addGraph('GraphLevel1');
                    ige.client.currentTileMap = ige.$("tileMap1");

                    // Add ui graph
                    ige.addGraph('GraphUi');

                    // Mouse pan with limits
                    //ige.$('vp1')
                    //	.addComponent(IgeMousePanComponent)
                    //	.mousePan.enabled(true)
                    //	.mousePan.limit(new IgeRect(-250, -200, 500, 400))

                    // if(location.search == '?bounds')
                    //     ige.$('vp1').drawBounds(true);
                    ige.$('vp1')
                        .addComponent(IgeMousePanComponent)
                        .addComponent(ScrollZoomComponent)
                        .addComponent(ScaleToPointComponent)
                        //.addComponent(PinchZoomComponent)
                        .addComponent(LimitZoomPanComponent, {
                            boundsX: 0,
                            boundsY: 0,
                            boundsWidth: parseInt(GameConfig.config['boundsWidth']),
                            boundsHeight: parseInt(GameConfig.config['boundsHeight'])
                        })

                        .mousePan.enabled(false)
                        .scrollZoom.enabled(false)
                        .autoSize(true)
                        .drawBounds(false) // Switch this to true to draw all bounding boxes
                        .drawBoundsData(false) // Switch this to true to draw all bounding boxes
                        .scene(ige.$('baseScene'))
                        .mount(ige);

                    clientSelf.mousePanStartHandler = ige.$('vp1').mousePan.on('panStart', function () {
                        clientSelf.fsm.enterState('pan');
                    });
                    clientSelf.mousePanEndHandler = ige.$('vp1').mousePan.on('panEnd', function () {
                        if (ige.client.isEditorOn !== undefined && ige.client.isEditorOn === true)
                            ige.client.fsm.enterState('editor');
                        else
                            clientSelf.fsm.enterState('select');
                    });

                    new Villager()
                        .id('bob')
                        .mount(ige.$('tileMap1'))

                    if (isTutorialShown === true) {
                        // Set the initial fsm state
                        self.fsm.initialState('loaded');
                    } else {
                        // Set the initial fsm state
                        self.fsm.initialState('tutorial');
                    }

                    dataLayer.push({'event': 'gameStart'});
                }

                if (success) {
                    var villageID = getParameterByName(location.search, 'v')
                    if (villageID) {
                        ige.client.viewVillageID = villageID;
                    }
                    API.init(postinit);
                }
            });
        });
    },

    /**
     * Returns the item occupying the tile co-ordinates of the tile map.
     * @param tileX
     * @param tileY
     */
    itemAt: function (tileMap, tileX, tileY) {
        // Return the data at the map's tile co-ordinates
        return ige.$(tileMap).map.tileData(tileX, tileY);
    },
    showGrid: function (tileMap) {
        ige.$(tileMap).drawGrid(true);
        ige.$(tileMap).highlightOccupied(true);
        ige.$('outlineEntity').show();
    },
    hideGrid: function (tileMap) {
        if (ige.$(tileMap)) {
            ige.$(tileMap).drawGrid(false);
            ige.$(tileMap).highlightOccupied(false);
        }
        ige.$('outlineEntity').hide();
    },
    setGameBoardPostTutorial: function (tutorialObjects) {
        if (!API.state.objects) {
            for (var i = 0; i < tutorialObjects.length; i++) {
                ClientHelpers.addObject(tutorialObjects[i], "tileMap1")
                ClientHelpers.moveOutPlayer()
                API.createObject(tutorialObjects[i])
                API.addUnlockedItem(tutorialObjects[i].classID);
            }
        }
    },
    createNewCursorObject: function (data) {
        var self = this,
            tileMap = ige.$('tileMapEditor'),
            tile, tx, ty, objectTileWidth, objectTileHeight, tileCenterX, tileCenterY;

        tile = tileMap.mouseToTile();

        ige.client.cursorObject = new ige.newClassInstance(data.classId)
            .mount(tileMap)
            .layer(24);

        objectTileWidth = ige.client.cursorObject.xTiles;
        objectTileHeight = ige.client.cursorObject.yTiles;

        tileCenterX = objectTileWidth;
        tileCenterY = objectTileHeight;

        if (tileCenterX % 2 === 0)
            tileCenterX -= 1;
        if (tileCenterY % 2 === 0)
            tileCenterY -= 1;

        tile.x -= Math.floor(tileCenterX / 2);
        tile.y -= Math.floor(tileCenterY / 2);

        // Check if the current tile is in grid, and align if not
        if(tile.x < 0)
            tile.x = 0;

        if(tile.y < 0)
            tile.y = 0;

        if(tile.x > ige.$('tileMapEditor').gridSize().x - ige.client.cursorObject.xTiles)
            tile.x = ige.$('tileMapEditor').gridSize().x - ige.client.cursorObject.xTiles;

        if(tile.y > ige.$('tileMapEditor').gridSize().y - ige.client.cursorObject.yTiles)
            tile.y = ige.$('tileMapEditor').gridSize().y - ige.client.cursorObject.yTiles;

        tx = tile.x + ige.client.cursorObject._tileAdjustX;
        ty = tile.y + ige.client.cursorObject._tileAdjustY;
        ige.client.cursorObject.translateToTile(tx, ty);
        ige.$('outlineEntity').translateToTile(tile.x, tile.y);

        ige.client.cursorObjectData = data;

        if (tileMap.inGrid(tile.x, tile.y, objectTileWidth, objectTileHeight)) {
            var isFree = !tileMap.isTileOccupied(
                tile.x,
                tile.y,
                objectTileWidth,
                objectTileHeight);
            ige.client.cursorObject.opacity(isFree ? 1 : 0.5);
            ige.$('outlineEntity').isFeasible = isFree;
        } else {
            ige.client.cursorObject.opacity(0.5);
            ige.$('outlineEntity').isFeasible = false;
        }

        ige.client.cursorObject.data('tileWidth', objectTileWidth)
            .data('tileHeight', objectTileHeight);

        ige.$('outlineEntity').tileWidth = objectTileWidth;
        ige.$('outlineEntity').tileHeight = objectTileHeight;
    }
});

if (typeof(module) !== 'undefined' && typeof(module.exports) !== 'undefined') {
    module.exports = Client;
}
