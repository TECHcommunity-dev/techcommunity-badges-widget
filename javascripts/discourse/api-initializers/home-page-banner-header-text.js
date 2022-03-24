import { apiInitializer } from "discourse/lib/api";
import { h } from "virtual-dom";
export default apiInitializer("0.11.1", (api) => {
  const currentUser = api.getCurrentUser();
  //If User is not logged-in then return, Else proceed
  if (!currentUser) {
    return;
  }
  //Create a new widget for the Home page banner header text
  api.createWidget("home-page-banner-header-text", {
    tagName: "div.sag-section-header",
    buildKey: () => "home-page-banner-header-text",
  
    html(attrs) {
      const result = [];
      if (currentUser) {
        //Get the banner text from the theme component settings (main_heading_content)
        let bannerTitleText = settings.main_heading_content;
        //Get the first name from the current User custom fields 
        let firstName = currentUser.custom_fields.user_field_6;
        //User First name present: then replace {First_name} with user's frist name.
        if (firstName) {
          bannerTitleText = bannerTitleText.replace('{First_name}', firstName);
        }
        //User first name not present: then replace {First_name} with "User" text.
        else {
          bannerTitleText.replace('{First_name}', "User");
        }
        result.push(h('span', { innerHTML: bannerTitleText }));
      }
      return result;
    }
  });
  //Mount the widget before the banner-content-widget.
  api.decorateWidget("banner-content-widget:before", function (helper) {
    return helper.attach("home-page-banner-header-text");
  });

});