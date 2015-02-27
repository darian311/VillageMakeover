var CashDialog = Dialog.extend({
	classId: 'CashDialog',
    init: function () {
        Dialog.prototype.init.call(this);

        var self = this

         var panel = new IgeUiElement()
            .id('coinDialogImage')
            .layer(0)
            .texture(ige.client.textures.moneyMenuBackground)
            .dimensionsFromTexture()
            .mount(this);

        for(var i=0; i < 5; i ++) {
            var offset = i * 173;
            if(i >= 3) offset += 20;
            var base =  new IgeUiLabel()
                .id('b' + i)
                .left(60 + offset)
                .top(123)
                .width(146)
                .height(284)
                .drawBounds(true)
                .mount(panel);

            var j = i + 1;
            new IgeUiLabel()
                .value( (j * 10) + " villagebucks\nfor $" + j + " USD")
                .bottom(13)
                .left(25)
                .width(150)
                .applyStyle({color: 'white'})
                .mount(base)

            base.mouseUp(function() {
                ige.input.stopPropagation();
                ige.client.audio.normClick.play();
                self.hide()

                Buy.buy({cash: (i + 1) * 5, coins: 0})
            })

        }
    }
})
