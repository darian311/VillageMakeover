var BuyConfirm = Dialog.extend({
	classId: 'BuyConfirm',
    init: function (message, callback) {
        Dialog.prototype.init.call(this);

        var self = this;

        var base = new IgeUiLabel()
            .width(400)
            .height(300)
			.texture(ige.client.textures.marketMenuBack)
            .mount(this);

        this.label =
            new IgeFontEntity()
            .colorOverlay('black')
            .nativeFont('22px Times New Roman')
            .width(600)
            .mount(base)
            .text(message);

        new IgeFontEntity()
            .colorOverlay('black')
            .nativeFont('25px Times New Roman')
            .left(34).bottom(25).width(50)
            .mount(base)
            .text('YES')
            .mouseUp(function() {
                self.hide();
                callback();
            });

        new IgeFontEntity()
            .colorOverlay('black')
            .nativeFont('25px Times New Roman')
            .right(30).bottom(25).width(50)
            .mount(base)
            .text('NO')
            .mouseUp(function() {
                self.hide();
            });
    },
})
