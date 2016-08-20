var WaterDialog = Dialog.extend({
    classId: 'WaterDialog',

    init: function () {
        Dialog.prototype.init.call(this);

        var self = this,
            water, pay, clonedItem;

        water = GameConfig.config['waterDialogWater'].split(",").map(parseFloat);
        pay = GameConfig.config['waterDialogPays'].split(",").map(parseFloat);

        for(var i=0; i < 5; i ++) {
            clonedItem = $('#waterAssetList li').first().clone();
            clonedItem.find(".assetAmount").first().text(water[i] + " Water for ");
            clonedItem.find(".assetPay").first().text(pay[i] + " VBucks");

            (function(i) {
                clonedItem.click(function() {
                    ige.input.stopPropagation();
                    vlg.sfx['select'].play();

                    self.hide();
                    $( "#waterBuyDialog" ).dialog( "close" );
                    self.closeMe();

                    var price = {
                        cash: pay[i],
                        coins: 0
                    };

                    var message = 'Buy ' + water[i] + ' water for ' + pay[i] + ' VBucks?';

                    var callBack = function() {
                        if(!API.reduceAssets(
                                {coins: parseInt(price.coins, 10),
                                    cash: parseInt(price.cash, 10)})) {
                            // Not enough money?
                            mixpanel.track("Not enough money");
                            ige.$('cashDialog').show();
                            return;
                        }
                        API.addWater(parseInt(water[i], 10));
                    }

                    if(price.cash > API.state.cash){
                        // Not enough money?
                        mixpanel.track("Not enough money");
                        message = GameConfig.config['notEnoughCashString'];
                        callBack = function() {
                            ige.$('cashDialog').show();
                        }
                    }

                    var cashDialog = new BuyConfirm(message,callBack)
                        .layer(1)
                        .show()
                        .mount(ige.$('uiScene'));
                })
            })(i);

            $('#waterAssetList').append(clonedItem);
        }
        $('#waterAssetList li').first().hide();

        this.closeButton.hide();
        this._underlay.hide();
    },

    show: function () {
        var self = this;

        ige.client.fsm.enterState('waterDialog', null, function (err) {
            if (!err) {
                $( "#waterBuyDialog" ).dialog({ resizable: false, draggable: true, closeOnEscape: false, width: 'auto', height: 'auto', modal: true, autoOpen: false, close: function( event, ui ) {self.closeMe();} });
                $( "#waterBuyDialog" ).dialog( "open" );
                Dialog.prototype.show.call(self);
            }
        });

        return this;
    }
})

