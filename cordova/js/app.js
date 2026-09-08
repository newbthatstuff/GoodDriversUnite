/**parse client setup */
Parse.initialize("2E203B1032A4311B2829D4FCD39683401E4AC6E0AppId");
Parse.serverURL = "http://gooddriversunite.com:1337/parse/";
window.currentUser = Parse.User.current();

var pictureSource; // picture source
var destinationType;
var parseFile = null;

var $$ = Dom7;

var app = new Framework7({
  root: "#app", // App root element
  id: "com.gooddriverunit", // App bundle ID
  name: "Good Drivers Unite", // App name
  theme: "auto", // Automatic theme detection
  // App root data
  data: function () { },
  // App root methods
  methods: {
    helloWorld: function () {
      app.dialog.alert("Hello World!");
    },
  },
  // App routes
  routes: routes,

  // Input settings
  input: {
    scrollIntoViewOnFocus: !!Framework7.device.cordova,
    scrollIntoViewCentered: !!Framework7.device.cordova,
  },
  // Cordova Statusbar settings
  statusbar: {
    overlay: (Framework7.device.cordova && Framework7.device.ios) || "auto",
    iosOverlaysWebView: true,
    androidOverlaysWebView: false,
  },
  on: {
   init: async function () {
      var f7 = this;
      if (f7.device.cordova) {
        // Init cordova APIs (see cordova-app.js)
        cordovaApp.init(f7);
      }
      await getNotification();
      await getAds();

      setInterval(function () {
        getNotification();
      }, 5000);
    },
  },
});

// Init/Create main view
var mainView = app.views.create(".view-main", {
  url: "/",
  on: {
    pageInit: function () {
      $("#topAd").hide();
      $("#middleAd").hide();
      $("#bottomAd").hide();
      if (!app.device.cordova) {
        $(".hideOnDesktop").hide();
      }
      else {
        $(".showOnDesktop").hide();
      }
      if (currentUser && typeof currentUser.get("uuid") != "undefined") {
        localStorage.setItem("deviceUUID", currentUser.get("uuid"));
      }


    }
  }
});

async function getNotification () {
  try {
    var adminNotification = Parse.Object.extend("adminNotification");
    var query = new Parse.Query(adminNotification);
    query.descending("createdAt");
    query.limit(1);
    var d = new Date();
    var date = new Date(d.getTime());
    var start = date.setHours(0, 0, 0, 0);
    var fromDate = moment(start).toDate();
    query.greaterThanOrEqualTo("expireDate", fromDate);
    var result = await query.find();
    if (result) {
      /**Check if this notification is already shown*/
      if (localStorage.getItem("adminNoti") != null) {
        if (result[0].id != localStorage.getItem("adminNoti")) {
          localStorage.setItem("adminNoti", result[0].id);
          var notificationClickToClose = app.notification.create({
            title: "Tip!",
            titleRightText: moment(result[0].get("createdAt")).format("ll"),
            //subtitle: 'Notification with close on click',
            text: result[0].get("message"),
            closeButton: true,
            closeOnClick: true,
          });
          notificationClickToClose.open();
        }
      } else {
        console.log(result[0].id);
        localStorage.setItem("adminNoti", result[0].id);
        var notificationClickToClose = app.notification.create({
          title: "Tip!",
          titleRightText: moment(result[0].get("createdAt")).format("ll"),
          //subtitle: 'Notification with close on click',
          text: result[0].get("message"),
          closeButton: true,
          closeOnClick: true,
        });
        notificationClickToClose.open();
      }
    }
  } catch (error) {
    console.log("Something went wrong");
  }
};
async function getAds () {
  try {
    var ad = Parse.Object.extend("Ad");
    var query = new Parse.Query(ad);
    query.descending("createdAt");
    query.limit(3);
    query.containedIn("type", ["top", "middle", "bottom"]);
    var result = await query.find();
    if (result.length) {
      for (var i = 0; i < result.length; i++) {
        if (result[i].get('type') === "top") {
          $("#topAdHref").attr("href", result[i].get('link'));
          $("#topAdImage").attr("src", result[i].get("file"));
          $('#topAd').show();
        } if (result[i].get("type") === "bottom") {
          $("#bottomAdHref").attr("href", result[i].get("link"));
          $("#bottomAdImage").attr("src", result[i].get("file"));
          $("#bottomAd").show();
        }
      }
    }
  } catch (error) {
    console.log("Something went wrong");
  }
};
const getCurrentRank = async function (uuid) {
  var grades = [];
  grades[1] = "A";
  grades[2] = "B";
  grades[3] = "C";
  grades[4] = "D";

  try {
    const from_date = moment().startOf("isoWeek");
    const to_date = moment().endOf("week");
    const trackLocation = Parse.Object.extend("trackLocation");
    const tQuery = new Parse.Query(trackLocation);
    tQuery.containedIn("grade", [1, 2, 3]);
    tQuery.greaterThanOrEqualTo("createdAt", from_date.toDate());
    tQuery.lessThanOrEqualTo("createdAt", to_date.toDate());
    tQuery.equalTo("uuid", uuid);
    tQuery.limit(200);
    tQuery.descending("createdAt");

    const tracks = await tQuery.find();
    if (tracks.length > 0) {
      var sum = 0;
      for (var i = 0; i < tracks.length; ++i) {
        sum += tracks[i].get("grade");
      }
      var avg = Math.round(sum / tracks.length);
      $("#gradeData").html(grades[avg]);
    } else {
      $("#gradeData").html("N/A");
    }
  } catch (error) {
    console.log("Something went wrong");
  }
};

const getTopSpeedOfTheDay = async function (uuid) {
  try {
    const trackLocation = Parse.Object.extend("trackLocation");
    const query = new Parse.Query(trackLocation);
    query.descending("speed");
    query.equalTo("uuid", uuid);
    query.equalTo("activity_type", "in_vehicle");
    query.limit(1);
    var d = new Date();
    var date = new Date(d.getTime());
    var start = date.setHours(0, 0, 0, 0);
    var end = date.setHours(23, 59, 59, 999);
    query.greaterThanOrEqualTo("createdAt", moment(start).toDate());
    query.lessThanOrEqualTo("createdAt", moment(end).toDate());
    const result = await query.find();
    if (result.length > 0) {
      var speed = Math.round(result[0].get("speed"));
      $("#speedData").html(speed + " km");
    } else {
      $("#speedData").html("0 km");
    }
    app.preloader.hide();
  } catch (error) {
    app.preloader.hide();
    console.log("Something went wrong");
  }
};

const getDrivingRecods = async function (uuid, dateRange) {
  app.preloader.show();
  try {
    const trackLocation = Parse.Object.extend("trackLocation");
    const query = new Parse.Query(trackLocation);
    query.descending("createdAt");
    query.equalTo("activity_type", "in_vehicle");
    query.equalTo("uuid", uuid);
    query.greaterThan("speed", 25);
    query.limit(200);

    if (typeof dateRange != "undefined" && dateRange.length > 0) {
      if (dateRange.length > 15) {
        /**Range selected*/
        var dates = dateRange.split(" - ");
        var dateFrom = new Date(dates[0]);
        var dateTo = new Date(dates[1]);
        var start = dateFrom.setHours(0, 0, 0, 0);
        var end = dateTo.setHours(23, 59, 59, 999);
        query.greaterThanOrEqualTo("createdAt", moment(start).toDate());
        query.lessThanOrEqualTo("createdAt", moment(end).toDate());
      } else {
        var date = new Date(dateRange);
        var start = date.setHours(0, 0, 0, 0);
        var end = date.setHours(23, 59, 59, 999);
        query.greaterThanOrEqualTo("createdAt", moment(start).toDate());
        query.lessThanOrEqualTo("createdAt", moment(end).toDate());
      }
    }
    /*var d = new Date();
    var date = new Date(d.getTime());
    var start = date.setHours(0, 0, 0, 0);
    var end = date.setHours(23, 59, 59, 999);
    query.greaterThanOrEqualTo("createdAt", moment(start).toDate());
    query.lessThanOrEqualTo("createdAt", moment(end).toDate());*/
    const result = await query.find();
    if (result.length > 0) {
      $("#drivingRecordsList").empty();
      var html = "";
      for (var i = 0; i < result.length; i++) {
        var speed = Math.ceil(result[i].get("speed"));
        var date = moment(result[i].get("createdAt")).format(
          "MMMM Do YYYY, h:mm:ss a"
        );
        var location = result[i].get("location");
        var latitude = location._latitude;
        var longitude = location._longitude;
        var objId = result[i].id;
        html =
          '<tr><td class="label-cell">' +
          date +
          "</td>" +
          '<td class="numeric-cell">' +
          speed +
          "</td>" +
          '<td class="numeric-cell"><a href="http://www.google.com/maps/place/' +
          latitude +
          "," +
          longitude +
          '" target="_blank" class="link external"><i class="f7-icons size-22">map_pin</i></a></td></tr>';
        $("#drivingRecordsList").append(html);
      }
      app.preloader.hide();
    } else {
      $("#drivingRecordsList").html("<p>No records found.</p>");
      app.preloader.hide();
    }
  } catch (error) {
    app.preloader.hide();
    console.log("Something went wrong");
  }
};

const getLeaderboards = async function () {
  app.preloader.show();
  try {
    /**First get the best drivers and for now always calculate last 14 days*/
    const from_date = moment().day(-1);
    const to_date = moment();
    console.log({ from_date, to_date });
    /**Run the query first to get the array of users in sorting order*/
    var trackLocation = Parse.Object.extend("trackLocation");
    var query = new Parse.Query(trackLocation);
    query.containedIn("grade", [1, 2]);
    query.ascending("grade");
    query.greaterThanOrEqualTo("createdAt", from_date.toDate());
    query.lessThanOrEqualTo("createdAt", to_date.toDate());
    query.limit(5000);
    const results = await query.find();
    $("#leaderboardList").empty();
    if (results.length > 0) {
      var userUUIDs = [];
      for (var i = 0; i < results.length; i++) {
        if ($.inArray(results[i].get("uuid"), userUUIDs) === -1) {
          userUUIDs.push(results[i].get("uuid"));
        }
        if (userUUIDs.length > 5) {
          break;
        }
      }
      if (userUUIDs.length > 0) {
        var rank = 1;
        const User = Parse.Object.extend("User");
        const query = new Parse.Query(User);
        query.descending("createdAt");
        query.containedIn("uuid", userUUIDs);
        const userResult = await query.find();
        for (var i = 0; i < userResult.length; i++) {
          var name = userResult[i].get("firstName");
          var location = userResult[i].get("location");
          var latitude = location._latitude;
          var longitude = location._longitude;
          html =
            '<tr><td class="label-cell">' +
            name +
            "</td>" +
            '<td class="numeric-cell">' +
            rank +
            "</td></tr>";
          $("#leaderboardList").append(html);
          rank++;
        }
        app.preloader.hide();
      } else {
        $("#leaderboardList").append("<p>No records found.</p>");
        app.preloader.hide();
      }
    } else {
      $("#leaderboardList").append("<p>No records found.</p>");
      app.preloader.hide();
    }
  } catch (error) {
    app.preloader.hide();
    console.log("Something went wrong");
  }
};

$$(document).on("deviceready", function () {
  if (device.platform === "Android") {
     app.dialog.alert(
       "Good Driver Unites collects location data to enable driving speed tracking even when the app is closed or not in use."
     );
   }
  /**Check if there's any notifications*/
  getNotification();

  /**Check every 5 seconds for a notification */
  setInterval(function () {
    getNotification();
  }, 5000);

  /**
    Store it to sync with the server post data for save location
    as JS doesn't fire on background mode
  */
  if (typeof window.device != "undefined") {
    localStorage.setItem("deviceUUID", window.device.uuid);
  }

  /*
    If user is not login, default values must be changed
  */
  if (!currentUser) {
    $("#logoutLink").hide();
    $("#loginLink").show();
  } else {
    $("#logoutLink").show();
    $("#loginLink").hide();
    $("#logoutLink").on("click", function () {
      app.dialog.confirm("Are you sure you want to logout?", function () {
        Parse.User.logOut();
        location.reload();
      });
      return;
    });
    /**Update uuid*/
    if (typeof window.device != "undefined") {
      currentUser.set("uuid", window.device.uuid);
      currentUser.save();
    }
    /*
      Set profile image if any
    */
    if (
      typeof currentUser.get("profilePicture") != "undefined" &&
      typeof currentUser.get("profilePicture")._url != "undefined"
    ) {
      $(".profile-picture").attr("src", currentUser.get("profilePicture")._url);
    }
    var name = currentUser.get("name") || currentUser.get("username");
    $(".label-name").html(name);
  }
  /**Camera and GEO locations */
  /*
     Initiate camera plugin
     */
  pictureSource = navigator.camera.PictureSourceType;
  destinationType = navigator.camera.DestinationType;
  mediaType = navigator.camera.MediaType;

  window.choseEditPhoto = function () {
    // Take picture using device camera and retrieve image as base64-encoded string
    navigator.camera.getPicture(onPhotoEditDataSuccess, onFail, {
      quality: 80,
      allowEdit: true,
      targetWidth: 500,
      targetHeight: 500,
      correctOrientation: true,
      destinationType: destinationType.DATA_URL,
      sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
      mediaType: mediaType.PICTURE,
    });
  };

  window.chooseFromLibrary = function () {
    // Take picture using device camera and retrieve image as base64-encoded string
    navigator.camera.getPicture(onPhotoDataSuccess, onFail, {
      quality: 60,
      allowEdit: true,
      targetWidth: 500,
      targetHeight: 500,
      correctOrientation: true,
      destinationType: destinationType.DATA_URL,
      sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
      mediaType: mediaType.PICTURE,
    });
  };

  window.captureEditPhoto = function () {
    // Take picture using device camera and retrieve image as base64-encoded string
    navigator.camera.getPicture(onPhotoEditDataSuccess, onFail, {
      quality: 60,
      allowEdit: true,
      targetWidth: 500,
      targetHeight: 500,
      correctOrientation: true,
      destinationType: destinationType.DATA_URL,
    });
  };

  window.capturePhoto = function () {
    // Take picture using device camera and retrieve image as base64-encoded string
    navigator.camera.getPicture(onPhotoDataSuccess, onFail, {
      quality: 70,
      allowEdit: true,
      targetWidth: 500,
      targetHeight: 500,
      correctOrientation: true,
      destinationType: destinationType.DATA_URL,
    });
  };

  function onPhotoEditDataSuccess(imageData) {
    clearCache();
    uploadEditFileToParseServer(imageData);
  }

  function onPhotoDataSuccess(imageData) {
    clearCache();
    uploadFileToParseServer(imageData);
  }

  function onFail(message) {
    clearCache();
    app.dialog.alert("File upload failed! " + message, "Error");
  }

  function uploadEditFileToParseServer(imageData) {
    /*
     Upload to parse server
     */
    var base64pic = "data:image/jpeg;base64," + imageData;
    parseFile = new Parse.File(Math.floor(Date.now() / 1000), {
      base64: base64pic,
    });
    parseFile.save().then(
      function () {
        /*
       update and show /
       */
        //var image = '<img src="' + parseFile._url + '" width="50">';
        //document.getElementById("editProfilePic").innerHTML = image;
        $(".profile-picture").attr("src", parseFile._url);
        var currentUser = Parse.User.current();
        currentUser.set("profilePicture", parseFile);
        currentUser.save(null, {
          success: function (currentUser) {
            console.log("Success");
          },
          error: function (currentUser, error) {
            app.dialog.alert(error.message, "Error!");
          },
        });
      },
      function (error) {
        app.dialog.alert(error.message, "Error!");
      }
    );
  }

  function uploadFileToParseServer(imageData) {
    /*
      Upload to parse server
     */
    var base64pic = "data:image/jpeg;base64," + imageData;
    parseFile = new Parse.File(Math.floor(Date.now() / 1000), {
      base64: base64pic,
    });
    parseFile.save().then(
      function () {
        var file = JSON.stringify(parseFile);
        document.getElementById("profilePictureHidden").value = file;
        var image = '<img src="' + parseFile._url + '" width="50">';
        document.getElementById("addProfilePic").innerHTML = image;
      },
      function (error) {
        app.dialog.alert(error.message, "Error!");
      }
    );
  }

  function clearCache() {
    navigator.camera.cleanup();
  }

  /*
    Geo Location Success/Fail
  */
  var onGeoSuccess = function (position) {
    window.localStorage.removeItem("lat");
    window.localStorage.removeItem("lng");

    var latitude = position.coords.latitude;
    var longitude = position.coords.longitude;

    localStorage.setItem("lat", latitude);
    localStorage.setItem("lng", longitude);

    /**Update current location of the user to location field*/
    if (currentUser) {
      var point = new Parse.GeoPoint({
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
      });
      currentUser.set("location", point);
      currentUser.save();
    }
  };

  // onError Callback receives a PositionError object
  function onGeoError(error) {
    //app.alert("We couldn't retrieve location information." + error.message);
  }

  /**Get the current location of the user */
  navigator.geolocation.getCurrentPosition(onGeoSuccess, onGeoError);
  Array.prototype.clean = function (deleteValue) {
    for (var i = 0; i < this.length; i++) {
      if (this[i] == deleteValue) {
        this.splice(i, 1);
        i--;
      }
    }
    return this;
  };

  var $select = $("#ageFrom");
  $select.append($("<option></option>").val("").html("from"));
  for (i = 18; i <= 60; i++) {
    $select.append($("<option></option>").val(i).html(i));
  }

  var $select = $("#ageTo");
  $select.append($("<option></option>").val("").html("to"));
  for (i = 19; i <= 70; i++) {
    $select.append($("<option></option>").val(i).html(i));
  }

  $("#ageFrom").change(function () {
    var val = parseInt($("#ageFrom").val());
    $("#ageTo").html("");
    for (i = val + 1; i <= 70; i++) {
      $("#ageTo").append("<option value='" + i + "'>" + i + "</option>");
    }
  });

  var bgGeo = window.BackgroundGeolocation;

  bgGeo.onLocation(function (location) {
    //console.log('[location] -', location);
  });

  bgGeo.onMotionChange(function (event) {
    //console.log('[motionchange] -', event.isMoving, event.location);
  });

  bgGeo.onHttp(function (response) {
    //console.log('[http] - ', response.success, response.status, response.responseText);
  });

  bgGeo.onProviderChange(function (event) {
    //console.log('[providerchange] -', event.status, event.enabled, event.gps, event.network);
  });

  // 2. Execute #ready method:
  bgGeo.ready(
    {
      backgroundPermissionRationale: {
      title: "Allow Good Drivers Unite to access to this device's location in the background?",
      message: "In order to track your activity in the background, please enable {backgroundPermissionOptionLabel} location permission",
      positiveAction: "Change to {backgroundPermissionOptionLabel}",
      negativeAction: "Cancel"
    },
      reset: true,
      debug: false,
      logLevel: bgGeo.LOG_LEVEL_VERBOSE,
      desiredAccuracy: bgGeo.DESIRED_ACCURACY_HIGH,
      distanceFilter: 0,
      locationUpdateInterval: 10000,
      //url: 'http://tracker.transistorsoft.com/locations/junal',
      url: "http://gooddriversunite.com:1337/parse/functions/saveLocation",
      //params: BackgroundGeolocation.transistorTrackerParams(device),
      params: {
        _ApplicationId: "2E203B1032A4311B2829D4FCD39683401E4AC6E0AppId",
        uuid: localStorage.getItem("deviceUUID"),
      },
      autoSync: true,
      stopOnTerminate: false,
      startOnBoot: true,
    },
    function (state) {
      // <-- Current state provided to #configure callback
      // 3.  Start tracking
      console.log("BackgroundGeolocation is configured and ready to use");
      if (!state.enabled) {
        bgGeo.start().then(function () {
          console.log("- BackgroundGeolocation tracking started");
        });
      }
    }
  );
});


$$(document).on("page:init", function (e) {
  console.log(e);
  if (typeof app.device !== "undefined" && app.device.desktop) {
    $(".hideOnDesktop").hide();
  }
  // if (!currentUser) {
  //   app.views.main.router.navigate("/login/");
  //   return;
  // }
});

/**Dashboard*/
$$(document).on("page:init", '.page[data-name="dashboard"]', async function (e) {
  if (!currentUser) {
    app.dialog.alert(
      "You are not logged in, please login to continue.",
      "Alert!",
      function () {
        app.views.main.router.navigate("/login/");
      }
    );
    return;
  }
  /**Get top speed of the day */
  if (localStorage.getItem("deviceUUID") != null) {
    app.preloader.show();
    await getCurrentRank(localStorage.getItem("deviceUUID"));
    await getTopSpeedOfTheDay(localStorage.getItem("deviceUUID"));
  }
});

/**leaderboards*/
$$(document).on("page:init", '.page[data-name="leaderboards"]', async function (e) {
  if (!currentUser) {
    app.dialog.alert(
      "You are not logged in, please login to continue.",
      "Alert!",
      function () {
        app.views.main.router.navigate("/login/");
      }
    );
    return;
  }
  await getLeaderboards();
});

/**My-records*/
$$(document).on("page:init", '.page[data-name="my-records"]', async function (e) {
  if (!currentUser) {
    app.dialog.alert(
      "You are not logged in, please login to continue.",
      "Alert!",
      function () {
        app.views.main.router.navigate("/login/");
      }
    );
    return;
  }
  var calendarRange = app.calendar.create({
    inputEl: "#date-range",
    rangePicker: true,
    maxDate: new Date(),
  });

  if (
    typeof currentUser.get("uuid") != "undefined" &&
    currentUser.get("uuid").length > 0
  ) {
    await getDrivingRecods(currentUser.get("uuid"));
  } else {
    app.dialog.alert("No driving records found.", "Alert!", function () {
      app.views.main.router.navigate("/");
    });
  }

  /**Search action*/
  $$("#submitDateRange").on("click", async function () {
    var formData = app.form.convertToData("#dateRangeForm");
    var dateRange = formData["date-range"];
    if (dateRange.length > 0) {
      await getDrivingRecods(currentUser.get("uuid"), dateRange);
    }
    return;
  });
});

/**Sign up */
$$(document).on("page:init", '.page[data-name="signup"]', function (e) {
  /**For iOS 13.0, hide add image option as its not supported yet*/
  if (typeof window.device != "undefined" && device.platform == "iOS") {
    $(".ppContainer").hide();
  }
  var calendarDefault = app.calendar.create({
    inputEl: "#dob",
    dateFormat: "M dd yyyy",
    //maxDate: new Date(2004, 4, 11),
    closeOnSelect: true,
    closeByOutsideClick: true,
  });
  /**Submit the form*/
  $$("#submitSignUpForm").on("click", function () {
    signUp();
  });
  const signUp = async function (a, b) {
    app.preloader.show();
    var formData = app.form.convertToData("#signUpForm");
    var profilePictureFile = document.getElementById("profilePictureHidden")
      .value;
    var user = new Parse.User();
    if (formData.firstName == "" || formData.firstName == "") {
      app.preloader.hide();
      return false;
    }
    user.set("firstName", formData.firstName);
    user.set("lastName", formData.lastName);
    user.set("username", formData.email.toLowerCase());
    user.set("email", formData.email);
    user.set("password", formData.password);
    user.set("city", formData.city);
    user.set("userStatus", true);

    user.set("carMake", formData.carMake);
    user.set("carModel", formData.carModel);
    user.set("carYear", parseInt(formData.carYear));

    if (typeof window.device != "undefined") {
      user.set("uuid", window.device.uuid);
    }

    if (profilePictureFile.length > 0) {
      profilePictureFile = JSON.parse(profilePictureFile);
      user.set("profilePicture", profilePictureFile);
    }
    if (formData.gender.length > 0) {
      user.set("gender", $.makeArray(formData.gender));
    }
    if (formData.dob.length > 0) {
      user.set("dob", new Date(formData.dob));
    }
    try {
      const result = await user.signUp();
      app.preloader.hide();
      app.dialog.alert(
        "You have successfully registered! An email has been sent to your inbox. Please verify your email before login.",
        "Success!",
        function () {
          app.views.main.router.navigate("/login/");
        }
      );
    } catch (error) {
      app.preloader.hide();
      app.dialog.alert(error.message);
    }
  };
  /*
     Add profile picture
     */
  $$("#addProfilePic").on("click", function () {
    var pictureTakenOptions = app.actions.create({
      buttons: [
        {
          text: "Take Photo",
          onClick: function () {
            /*
             Capture picture
             */
            capturePhoto();
          },
        },
        {
          text: "Choose Photo",
          onClick: function () {
            /*
             Choose from library
             */
            chooseFromLibrary();
          },
        },
        {
          text: "Cancel",
        },
      ],
    });
    pictureTakenOptions.open();
  });

  /*
    When user select profile picture
  */
  $("#profilePicture").on("change", function (event) {
    $(".alert-success").html("Please wait...").show();
    var file;
    file = $(this).get(0).files[0];
    var name = $(this).get(0).files[0].name;
    name = name.replace(/[ ,]+/g, "-");
    var parseFile = new Parse.File($.trim(name), file);
    parseFile.save().then(
      function () {
        /*
       save it to the hidden field
       */
        $("#profilePictureHidden").val(JSON.stringify(parseFile));
      },
      function (error) {
        $(".error")
          .html("Image upload failed." + JSON.stringify(error))
          .show();
      }
    );
  });
});

/**Login*/
$$(document).on("page:init", '.page[data-name="login"]', function (e) {
  $$("#submitLoginForm").on("click", function () {
    app.preloader.show();
    var username = $("#username").val();
    var password = $("#password").val();
    logIn(username, password);
  });
  const logIn = async function (username, password) {
    try {
      const user = await Parse.User.logIn(username, password);
      /*if(!user.get('userStatus')){
        app.preloader.hide();
        Parse.User.logOut();
        app.dialog.alert('Your account has been deactivated.', 'Warning!');
      }else {
        location.reload();
      }*/
      location.reload();
    } catch (error) {
      app.preloader.hide();
      app.dialog.alert(error.message);
    }
  };
});

/**Reset password */
$$(document).on(
  "page:init",
  '.page[data-name="forgot-password"]',
  function (e) {
    $$("#submitForgotPasswordForm").on("click", function () {
      var email = $.trim($("#email").val());
      if (email) {
        Parse.User.requestPasswordReset(email)
          .then(() => {
            /**Success, now redirect to the login page*/
            app.dialog.confirm(
              "An email has been sent to your inbox, please follow instruction to reset your password.",
              function () {
                app.views.main.router.navigate("/login/");
              }
            );
            return;
          })
          .catch((error) => {
            // Show the error message somewhere
            app.dialog.confirm(error.message, "Error!");
            //alert("Error: " + error.code + " " + error.message);
          });
      }
    });
  }
);

/** Edit profile + upload video */
$$(document).on("page:init", '.page[data-name="edit-profile"]', function (e) {
  if (!window.currentUser) {
    /**Show popup and redirect to login page */
    app.dialog.confirm(
      "You are not logged in, in order to use this page, you must Login first.",
      function () {
        app.views.main.router.navigate("/login/");
      }
    );
  } else {
    if (
      typeof currentUser.get("profilePicture") != "undefined" &&
      typeof currentUser.get("profilePicture")._url != "undefined"
    ) {
      var image =
        '<img src="' + currentUser.get("profilePicture")._url + '" width="50">';
      document.getElementById("editProfilePic").innerHTML = image;
    }
    /**For iOS 13.0, hide add image option as its not supported yet*/
    if (typeof window.device != "undefined" && device.platform == "iOS") {
      $(".ppContainer").hide();
    }

    var updateCalendar = app.calendar.create({
      inputEl: "#dob",
      dateFormat: "M dd yyyy",
      //maxDate:new Date(2004, 11, 1),
      closeOnSelect: true,
      closeByOutsideClick: true,
    });
    if (
      typeof currentUser.get("firstName") != "undefined" &&
      currentUser.get("firstName").length > 0
    ) {
      $("#firstName").val(currentUser.get("firstName"));
    } else {
      $("#firstName").empty();
    }
    if (
      typeof currentUser.get("lastName") != "undefined" &&
      currentUser.get("lastName").length > 0
    ) {
      $("#lastName").val(currentUser.get("lastName"));
    } else {
      $("#lastName").empty();
    }
    if (
      typeof currentUser.get("gender") != "undefined" &&
      currentUser.get("gender").length > 0
    ) {
      $("#gender").val(currentUser.get("gender"));
    }
    if (typeof currentUser.get("dob") != "undefined") {
      updateCalendar.setValue([currentUser.get("dob")]);
    }
    if (
      typeof currentUser.get("carMake") != "undefined" &&
      currentUser.get("carMake").length > 0
    ) {
      $("#carMake").val(currentUser.get("carMake"));
    }
    if (currentUser.get("carYear")) {
      $("#carYear").val(currentUser.get("carYear"));
    }
    if (
      typeof currentUser.get("carModel") != "undefined" &&
      currentUser.get("carModel").length > 0
    ) {
      $("#carModel").val(currentUser.get("carModel"));
    }
    /**Edit profile picture*/
    $$("#editProfilePic").on("click", function () {
      var pictureTakenOptions = app.actions.create({
        buttons: [
          {
            text: "View Photo",
            onClick: function () {
              if (
                typeof currentUser.get("profilePicture") != "undefined" &&
                typeof currentUser.get("profilePicture")._url != "undefined"
              ) {
                window.open(
                  currentUser.get("profilePicture")._url,
                  "_blank",
                  "location=yes"
                );
              }
            },
          },
          {
            text: "Take Photo",
            onClick: function () {
              /*
               Capture picture
               */
              captureEditPhoto();
            },
          },
          {
            text: "Choose Photo",
            onClick: function () {
              /*
               Choose from library
               */
              choseEditPhoto();
            },
          },
          {
            text: "Cancel",
          },
        ],
      });
      pictureTakenOptions.open();
    });

    /**Update the form */
    $$("#submitUpdateProfileForm").on("click", function () {
      var currentUser = Parse.User.current();
      var formData = app.form.convertToData("#updateProfileForm");
      app.preloader.show();
      currentUser.set("firstName", formData.firstName);
      currentUser.set("lastName", formData.lastName);

      if (formData.gender.length > 0) {
        currentUser.set("gender", $.makeArray(formData.gender));
      }
      if (formData.dob.length > 0) {
        currentUser.set("dob", new Date(formData.dob));
      }
      if (formData.carMake.length > 0) {
        currentUser.set("carMake", formData.carMake);
      }
      if (formData.carYear.length > 0) {
        currentUser.set("carYear", parseInt(formData.carYear));
      }
      if (formData.carModel.length > 0) {
        currentUser.set("carModel", formData.carModel);
      }
      currentUser.save().then(
        (currentUser) => {
          app.preloader.hide();
          app.dialog.alert("Your profile has been updated!", "Success!");
        },
        (error) => {
          app.preloader.hide();
          app.dialog.alert(error.message, "Error!");
        }
      );
    });

    /**Deactivate user profile*/
    $("#deleteMyAccount").on("click", function () {
      app.dialog.confirm(
        "Are you sure you want to delete your account?",
        function () {
          var dataAcc = {
            user: currentUser.id,
          };
          Parse.Cloud.run("deleteUserAccount", dataAcc).then(function (result) {
            Parse.User.logOut();
            location.reload();
          });
        }
      );
    });
  }
});
