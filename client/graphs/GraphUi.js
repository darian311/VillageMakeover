var GraphUi = IgeSceneGraph.extend({
	classId: 'GraphUi',

	/**
	 * Called when loading the graph data via ige.addGraph().
	 * @param options
	 */
	addGraph: function (options) {
		var self = ige.client,
			uiScene = ige.$('uiScene');

		// Build menu
		var buildMenu = new IgeUiElement()
			.id('buildMenu')
			.layer(0)
			.texture(self.textures.mainMenuBackground)
			.dimensionsFromTexture()
			.bottom(0)
			.center(0)
			.mouseEventsActive(false)
			.mount(uiScene);

		var buildButton = new IgeUiElement()
			.id('buildButton')
			.addGroup('uiButton')
			.texture(self.textures.buildButton)
			.dimensionsFromTexture()
			.translateTo(436, 47, 0)
			.mount(buildMenu);

		var giftButton = new IgeUiElement()
			.id('giftButton')
			.addGroup('uiButton')
			.texture(self.textures.giftButton)
			.dimensionsFromTexture()
			.translateTo(352, 66, 0)
			.mount(buildMenu);


		var actionButton = new IgeUiElement()
			.id('actionButton')
			.addGroup('uiButton')
			.texture(self.textures.actionButtonBack)
			.dimensionsFromTexture()
			.translateTo(274, 80, 0)
			.mount(buildMenu);

		var townName = new IgeEntity()
			.id('townName')
			.texture(self.textures.townName)
			.dimensionsFromTexture()
			.translateTo(-372, 100, 0)
			.mount(buildMenu);

		var marketDialog = new MarketDialog()
			.id('marketDialog')
			.layer(1)
			.hide()
			.mount(uiScene);

        GameObjects.setupMarket(marketDialog)

        var coinDialog = new CoinDialog()
			.id('coinDialog')
			.layer(1)
			.hide()
			.mount(uiScene);

		var cashBar = new IgeUiElement()
			.id('cashBar')
			.texture(ige.client.textures.cashBar)
			.dimensionsFromTexture()
			.top(10)
			.center(-300)
			.mount(uiScene);

        new IgeUiProgressBar()
			.id('cashProgress')
			.barColor('#69f22f')
			.min(0)
			.max(100)
			.progress(80)
			.width(87)
			.height(18)
			.right(17)
            .barText('$', '', 'black')
			.mount(cashBar);

		var coinsBar = new IgeUiElement()
			.id('coinsBar')
			.texture(ige.client.textures.coinsBar)
			.dimensionsFromTexture()
			.top(10)
			.center(-100)
			.mount(uiScene);

		new IgeUiProgressBar()
			.id('coinsProgress')
			.barColor('#69f22f')
			.min(0)
			.max(100)
			.progress(80)
			.width(87)
			.height(18)
			.right(17)
            .barText('', ' coins', 'black')
			.mount(coinsBar);

		var xpBar = new IgeUiElement()
			.id('xpBar')
			.texture(ige.client.textures.xpBar)
			.dimensionsFromTexture()
			.top(10)
			.center(100)
			.mount(uiScene);

        new IgeUiProgressBar()
			.id('xpProgress')
			//.barBackColor('#f2b982')
			//.barBorderColor('#3a9bc5')
			.barColor('#69f22f')
			.min(0)
			.max(100)
			.progress(80)
			.width(87)
			.height(18)
			.right(17)
            .barText('', ' XP', 'black')
			.mount(xpBar);

		new IgeUiElement()
			.id('energyBar')
			.texture(ige.client.textures.energyBar)
			.dimensionsFromTexture()
			.top(10)
			.center(300)
            //.barText('', '%', 'black')
			.mount(uiScene);

		new IgeParticleEmitter()
			.id('coinEmitter')
			.layer(10)
			.quantityTimespan(600)
			.quantityBase(10)
			.velocityVector(new IgePoint3d(0, -0.030, 0), new IgePoint3d(-0.025, -0.005, 0), new IgePoint3d(0.025, -0.01, 0))
			.linearForceVector(new IgePoint3d(0, 0.25, 0), new IgePoint3d(0, 0, 0), new IgePoint3d(0, 0, 0))
			.scaleBaseX(2)
			.scaleBaseY(2)
			.deathScaleBaseX(2)
			.deathScaleBaseY(2)
			.deathRotateBase(0)
			.deathRotateVariance(0, 360)
			.deathOpacityBase(0)
			.quantityMax(10)
			.particle(CoinParticle)
			.mount(uiScene)
			.top(20)
			.center(-146);

		this.addActions();
	},

	addActions: function () {
		ige.$('buildButton')
			.mouseUp(function () {
				// Open the build menu
				ige.$('marketDialog').show();
			});
        ige.$('giftButton')
            .mouseUp(function() {
                ige.$('coinDialog').show();
            })
	},

	/**
	 * The method called when the graph items are to be removed from the
	 * active graph.
	 */
	removeGraph: function () {
		// Since all our objects in addGraph() were mounted to the
		// 'scene1' entity, destroying it will remove everything we
		// added to it.
		ige.$('scene1').destroy();
	}
});
