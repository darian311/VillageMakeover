var GameLogic = IgeObject.extend({
    classId: 'GameLogic',

    init: function () {
        IgeObject.prototype.init.call(this);

        var self = this,
            currentGoalID,
            marketDialog = ige.$('marketDialog');

        //add unlocked market items based on user state
        for(var i in API.state.objects){
            var item = API.state.objects[i],
                options = GameObjects.catalogLookup[item.name]

            if(options.enabled)
                self.unlockMarketDialogItem(marketDialog.getItemByID(item.name));

            if(options.unlocks !== "none"){
                var unlockedOptions = GameObjects.catalogLookup[options.unlocks]
                if(unlockedOptions.enabled)
                    self.unlockMarketDialogItem(marketDialog.getItemByID(options.unlocks));
            }
        }

        //add unlocked market items based on unlockedItems in user state
        for(var i in API.state.unlockedItems){
            var itemID = API.state.unlockedItems[i];
            var itemData = marketDialog.getItemByID(itemID);

            this.unlockMarketDialogItem(itemData);
        }

        //add notify icons for special events
        for(var i in API.state.objects) {
            var item = API.state.objects[i];

            if(item.buildCompleted){
                (function(item){
                    setTimeout(function(){
                        ige.$(item.id).notifySpecialEvent();
                    },100);
                })(item);
            }
        }

        self.goals = new Goals()

        $('#goalDialogContent').html("There is no active goal at the moment!");
        //jquery prepare dialog
        $( "#goalDialog" ).dialog({ resizable: false, draggable: true, closeOnEscape: true, title: "Goals", close: function( event, ui ) {ige.client.fsm.enterState('select')}, width: 400, height: 250, modal: true, autoOpen: false });

        //on goal load prepare ui
        self.goals.on("goalLoaded",function(data){
            //jquery fill ul with task titles
            var items = [];
            $.each(data.gameGoalObj.tasks, function (id, value) {
                var itemImg = "";
                if(value.targetOBJ.substr(0,2) === '__'){
                    var itemID, options, dummyElem, imgWidth, imgHeight;
                    itemID = value.targetOBJ.substr(2);
                    options = GameObjects.catalogLookup[itemID]
                    dummyElem = $("<div class='goalTaskImage'></div>").hide().appendTo("body");
                    imgHeight = dummyElem.css("height").substr(0,dummyElem.css("height").indexOf('px'));
                    imgWidth = ige.client.textures[itemID]._sizeX / (ige.client.textures[itemID]._sizeY / imgHeight)
                    dummyElem.remove();
                    itemImg = "<span class='goalTaskImage' style='background-image: url(" + options.textureUrl + ");width:" + imgWidth / ige.client.textures[itemID]._cellColumns + "px;background-size:" + imgWidth + "px " + imgHeight + "px;background-position-x: "+ imgWidth / ige.client.textures[itemID]._cellColumns +"px;'></span>";
                }
                items.push('<li>' + itemImg + " "+ value.title  +  "<span id='task" + value.taskID + "' style='float:right;'>" + value.percent + "%</span></li>");
            });
            $('#goalDialogContent').html("<ul id='taskList'>" + items.join('') + "</ul>");
            //jquery prepare dialog
            $( "#goalDialog" ).dialog({ resizable: false, draggable: true, closeOnEscape: true, title: data.gameGoalObj.goalTitle, close: function( event, ui ) {ige.client.fsm.enterState('select')}, width: 400, height: 250, modal: true, autoOpen: false });
            //ui show goal button
            if(data.isNewGoal)
                $('#newGoalNotification').show()
        })

        //on goal complete load next goal
        // on goal complete this should trigger ige.fsm to enterstate goalDialog, which would then handle showing
        // D
        self.goals.on("goalComplete",function(data){
            //add reward assets
            var rewardsArr = data.reward.split(","),
                rewardsObj = {}, assets, totalAssets, startX, distribution = 75;//pixels

            for(var i = 0; i < rewardsArr.length; i++){
                assets = rewardsArr[i].split(":");
                rewardsObj[assets[0]] = assets[1];
            }
            totalAssets = Object.keys(rewardsObj).length;
            startX = ( (totalAssets - 1) * -distribution / 2 ) -distribution;
            for(var item in rewardsObj){
                startX += distribution;
                self.rewardMechanism.claimReward(item, rewardsObj[item],{x:(-ige.$('uiScene')._renderPos.x + startX),y:200,z:0});
            }

            API.setGoalAsComplete(data.goalID)

            //popup congrats message
            $('#goalDialogContent').html("<p>" + data.message + "</p>");
            $( "#goalDialog" ).dialog({ resizable: false, draggable: true, closeOnEscape: true, title: data.title, close: function( event, ui ) {self.goals.loadNextGoal(data.goalID)}, width: 400, height: 250, modal: true, autoOpen: false });
            $( "#goalDialog" ).dialog( "open" );
        })

        //on eventComplete update goal dialog percentage
        self.goals.on("eventComplete",function(taskObj){
            var item = taskObj.item
            API.updateGoal(API.state.currentGoalID,item.taskID,item._eventCount)
            $('#task'+item.taskID).html(Math.floor(item._eventCount * 100 / item.count) + '%');
        })

        if(!API.state.goals){
            //load first goal
            self.goals.loadGoal(GameGoals.settings.startID)
            API.createGoal(GameGoals.settings.startID)
        }else if(API.state.currentGoalID){
            currentGoalID = API.state.currentGoalID
            if(API.stateGoalsLookup[currentGoalID].isComplete){
                //load next goal
                self.goals.loadNextGoal(currentGoalID)
            }else{
                //load current goal
                self.goals.loadGoal(currentGoalID, API.stateGoalsLookup[currentGoalID])
            }
        }

        self.rewardMechanism = new RewardMechanism();

        //set earnings on handlers
        for(var item in GameEarnings.earnings){
            var arr = GameEarnings.earnings[item]
            for(var i = 0; i < arr.length; i++){
                (function(i, arr){
                    ige.client.eventEmitter.on(item, function(data){
                        var translateObj = null;
                        if(data.positionX || data.positionY){
                            translateObj = {};
                            translateObj.x = data.positionX || 0;
                            translateObj.y = data.positionY || 0;
                            translateObj.z = 0;
                        }
                        self.rewardMechanism.claimReward(arr[i].asset, arr[i].amount, translateObj, data.itemRef)
                    })
                })(i, arr)
            }
        }

        //on item build unlock new item
        ige.client.eventEmitter.on('build', function(data){
            if(data.unlocks !== "none" && API.getUnlockedItem(data.unlocks) === null){
                var options = GameObjects.catalogLookup[data.unlocks]
                if(options.enabled && options.dependency !== "none"){
                    self.unlockMarketDialogItem(marketDialog.getItemByID(data.unlocks));
                    marketDialog.showUnlockMessage(options.name);
                }
            }
        })
    },

    unlockMarketDialogItem: function(itemData){
        var marketDialog = ige.$('marketDialog');

        marketDialog.removeItemCover(itemData);
        API.addUnlockedItem(itemData.id);
    }
})