import { apiInitializer } from "discourse/lib/api";
import { h } from "virtual-dom";
import { iconHTML, iconNode } from "discourse-common/lib/icon-library";
import UserBadge from "discourse/models/user-badge";
import Badge from "discourse/models/badge";
export default apiInitializer("0.11.1", (api) => {
    //Get current user
    const currentUser = api.getCurrentUser();
    //If User is not logged-in then return, Else proceed    
    if (!currentUser) {
        return;
    }
    //Get current username
    const userName = currentUser.username;
    //Create a new widget for display badges on home page banner text 
    api.createWidget("home-page-badges", {
        tagName: "div.discourse-home-page-badges",
        buildKey: () => "home-page-badges",
        defaultState() {
            return { loading: false };
        },
        //Fetch the badges full object 
        loadBadges() {
            if (this.state.loading) { return; }
            this.state.loading = true;
            this.state.badges = 'empty';
            var filteredBadges;
            var filteredBadgesAfterRemovingEarnedBadges;
            var allBadges;
            var userBadges;
            //Get Allbadges 
            Badge.findAll().then(
                (badges) => {
                    allBadges = badges;
                    //Check badges not empty
                    if (allBadges && allBadges.length > 0) {
                        //If allowed badges ids empty then return, Else proceed    
                        if (!(settings. allowed_badges_id)) {
                            return;
                        }
                        //Split the badges Ids and convert string array to int array 
                        const badgesIdSplit = settings. allowed_badges_id.split(',');
                        var includeBadges = badgesIdSplit.map(Number);
                        //Filter allowed badges from all badges 
                        filteredBadges = allBadges.filter((badge) => {
                            return includeBadges.indexOf(badge.id) > -1;
                        });
                        //Get user Earned badges                       
                        UserBadge.findByUsername(userName).then(
                            (currentUserBadges) => {
                                userBadges = currentUserBadges;
                                let badgesToDisplay = [];
                                //If user Earned Badges not empty then proceed                         
                                if (userBadges && userBadges.length > 0) {
                                    //Filter only those badges the user didn't earn.
                                    filteredBadgesAfterRemovingEarnedBadges = filteredBadges.filter((badge) => {
                                        return !userBadges.find(eb => {
                                            return eb.badge_id === badge.id;
                                        });
                                    });
                                }
                                else {
                                    filteredBadgesAfterRemovingEarnedBadges = filteredBadges;
                                }
                                //Separate the badges based on badge type                                                       
                                /**
                                * Here we have list of badges object in th filteredBadgesAfterRemovingEarnedBadges with the diffrent badge-types [say 1(Bronze), 2(Silver), and 3(Gold)]
                                * Then the below reduce function will return an object that will contain the arrays of badges of the same type, where the property name will indicate the badge_type_id
                                * ex: 
                                 {
                                   1: [
                                        {"id": 201,"name": "gold badge","grant_count": 1,"badge_type_id": 1,...}...
                                      ]
                                   2: [
                                        {"id": 3,"name": "Guru","grant_count": 1,"badge_type_id": 2,...}
                                        {"id": 104,"name": "Great helper","grant_count": 1,"badge_type_id": 2,...}...
                                      ] 
                                   3: [
                                       {"id": 25,"name": "Promoter","grant_count": 0,"badge_type_id": 3, ...}
                                        {"id": 12,"name": "First Share","grant_count": 0,,"badge_type_id": 3, ...} ...	
                                      ]
                                 }
                                **/
                                let groupByBadgesType = filteredBadgesAfterRemovingEarnedBadges.reduce(function(rv, x) {
                                    (rv[x["badge_type_id"]] = rv[x["badge_type_id"]] || []).push(x);
                                    return rv;
                                  }, {});
                                
                                //Declearing badge types with there ids.
                                const BADGE_TYPE = {
                                    GOLD: 1,
                                    SILVER: 2,
                                    BRONZE: 3,
                                };
                                /*Sort by grant_count in descending order
                                Add the all badges based on grant_count descending order */
                                if (groupByBadgesType) {
                                    let bronzeBadges = groupByBadgesType[BADGE_TYPE.BRONZE];
                                    //Sort the bronze badges based on grant count and then add them to badgesToDisplay array.                                  
                                    if (bronzeBadges) {
                                        badgesToDisplay = badgesToDisplay.concat(bronzeBadges.sort((f, s) => f.grant_count > s.grant_count ? -1 : 1));
                                    }
                                    let silverBadgse = groupByBadgesType[BADGE_TYPE.SILVER];
                                    //Sort the silver badges based on grant count and then add them to badgesToDisplay array.                                  
                                    if (silverBadgse) {
                                        badgesToDisplay = badgesToDisplay.concat(silverBadgse.sort((f, s) => f.grant_count > s.grant_count ? -1 : 1));
                                    }
                                    let goldBadges = groupByBadgesType[BADGE_TYPE.GOLD];
                                    //Sort the gold badges based on grant count and then add them to badgesToDisplay array.
                                    if (goldBadges) {
                                        badgesToDisplay = badgesToDisplay.concat(goldBadges.sort((f, s) => f.grant_count > s.grant_count ? -1 : 1));
                                    }
                                    badgesToDisplay = badgesToDisplay.slice(0, settings.number_of_badges);
                                }
                                this.state.badges = badgesToDisplay;
                                this.state.loading = false;
                                //Refresh the widget after getting the badges.
                                this.scheduleRerender();
                            }
                        );
                    }
                }
            );
        },
        //Generate the virtual-dom for display badges on the home page banner.
        html(attrs) {
            const result = [];
            //Declearing badge types with there ids.
            const BADGE_TYPE = {
                GOLD: 1,
                SILVER: 2,
                BRONZE: 3,
            };
            //Load the badges if not loaded.
            if (!this.state.badges) {
                this.loadBadges();
            }
            /*Set badges are clickable and when clicked to badge lead to the specific badge page
             On hover set the badge title and short description using anchor tag. */
            if (this.state.badges !== 'empty' && this.state.badges.length > 0) {
                this.state.badges.forEach((badge) => {
                    var iconClass = "";
                    //Setting icon color based on badge-type.
                    switch(badge.badge_type_id){
                        case BADGE_TYPE.GOLD:
                            iconClass = ".badge-type-gold"; break;
                        case BADGE_TYPE.SILVER:
                            iconClass = ".badge-type-silver"; break;
                        default:
                            iconClass = ".badge-type-bronze";
                    }
                    var badgesURL = "/badges/" + badge.id + "/" + (badge.name).replace(' ', '-');
                    result.push(h("a.badge-link" + iconClass, { href: badgesURL }, 
                        [
                            h("span.badge-icon", iconNode((badge.icon).replace('fa-', ''))), 
                            h("span.badge-tooltip-text", 
                                [
                                    h("span.badge-name",{ innerHTML: badge.name }),
                                    h("span.badge-description", { innerHTML: "<br />" + badge.description })
                                ]
                            )
                        ]));
                });
            }
            return result;
        }
    });
    //Mount the widget after the banner-content-widget.
    api.decorateWidget("banner-content-widget:after", function (helper) {
        return helper.attach("home-page-badges");
    });
});
