/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

// Initializes AppManage.
function AppManage() {
  this.checkSetup();

  // Shortcuts to DOM Elements.
  this.messageForm = document.getElementById('message-form');
  // Data
  this.appFeatureInput = document.getElementById('app_feature');
  this.appNameInput = document.getElementById('app_name');
  this.packageName = document.getElementById('package_name');
  this.longDescription = document.getElementById('long_description');
  this.shortDescription = document.getElementById('short_description');
  this.appIcon = document.getElementById('app_icon');

  this.submitButton = document.getElementById('submit');
  this.submitImageButton = document.getElementById('submitImage');
  this.imageForm = document.getElementById('image-form');
  this.mediaCapture = document.getElementById('mediaCapture');

  this.submitFeatureImage = document.getElementById('submitFeatureImage');
  this.imageFormFeature = document.getElementById('image-form-feature');
  this.featureCapture = document.getElementById('featureCapture');


  this.userPic = document.getElementById('user-pic');
  this.userName = document.getElementById('user-name');
  this.signInButton = document.getElementById('sign-in');
  this.signOutButton = document.getElementById('sign-out');
  this.signInSnackbar = document.getElementById('must-signin-snackbar');

  this.recommend = document.getElementById('recommend');
  this.promotion = document.getElementById('promotion');

  this.selRecommend = document.getElementById('sel_recommend');
  this.selPromotion = document.getElementById('sel_promotion');

  // Saves message on form submit.
  this.messageForm.addEventListener('submit', this.saveData.bind(this));
  this.signOutButton.addEventListener('click', this.signOut.bind(this));
  this.signInButton.addEventListener('click', this.signIn.bind(this));

  // Events for image upload app icon.
  this.submitImageButton.addEventListener('click', function(e) {
    e.preventDefault();
    this.mediaCapture.click();
  }.bind(this));
  this.mediaCapture.addEventListener('change', this.saveAppIcon.bind(this));

  // Events for image upload feature image
  this.submitFeatureImage.addEventListener('click', function(e) {
    e.preventDefault();
    this.featureCapture.click();
  }.bind(this));
  this.featureCapture.addEventListener('change', this.saveFeatureImage.bind(this));

  this.packageName.addEventListener('keyup', function() {
    if($('#package_name').val() != '') {
      $('#submitImage').attr("disabled", false);
      $('#submitFeatureImage').attr("disabled", false);
    } else {
      $('#submitImage').attr("disabled", true);
      $('#submitFeatureImage').attr("disabled", true);
    }
  });

  // Event sort recommend
  this.selRecommend.addEventListener('change', function() {
    var value = $(this).val();
    sortUsingNestedText($('#recommend'), 'li', 'input.order_class', value);
  });

  // Event sort promotion
  this.selPromotion.addEventListener('change', function() {
    var value = $(this).val();
    sortUsingNestedText($('#promotion'), 'li', 'input.order_class', value);
  });

  this.copyNodeRecommend = '';
  this.copyNodePromotion = '';

  this.initFirebase();
}
// Loads chat messages history and listens for upcoming ones.
AppManage.prototype.loadMessages = function() {
  // Reference to the /messages/ database path.
  this.messagesRef = this.database.ref('test_apps');
  // Make sure we remove all previous listeners.
  this.messagesRef.off();

  // Loads the last 12 messages and listen for new ones.
  var setMessage = function(data) {
    var val = data.val();
    this.displayMessage(data.key, val);
  }.bind(this);

  // Load data table
  this.messagesRef.on('value', function(snapshot) {
    var arr = snapshot.val();
    var data = $.map(arr, function(el) { return el });
    var out = '<tbody>';
    for(var i = 0; i< data.length; i ++) {
      var defaultImage = data[i].app_icon != "" ? data[i].app_icon : 'images/noPicture.png';
      var id = data[i].package_name.split('.').join('_');
      out += '<tr>';
      out += '<td>' + data[i].app_name + '</td>';
      out += '<td class="verti-align"><img class="app-icon-table" src="' + defaultImage + '"></td>';
      out += '<td>' + data[i].status + '</td>';
      out += '<td><a href="#messages-card-container" id="edit'+ id +'" class="btn btn-info" onclick="editApp(this.id)">Edit</a></td>';
      out += '</tr>';
    }

    out += '</tbody>';

    $('#example').append(out);
    $('#example').dataTable();
  });

  this.messagesRef.limitToLast(100).on('child_added', setMessage);
  this.messagesRef.limitToLast(100).on('child_changed', setMessage);
};

function editApp(id) {
  id = id.substring(4, id.length);
  var database = firebase.database();
  database.ref('test_apps').child(id).on('value',function(snapshot) {
    $('#app_name').val(snapshot.val().app_name);
    $('#app_name').parent().addClass('is-dirty');

    $('#app_feature').val(snapshot.val().app_feature);
    $('#preview-feature').attr('src', snapshot.val().app_feature != '' ? snapshot.val().app_feature : 'images/noPicture.png');
    $('#app_feature').parent().addClass('is-dirty');

    $('#package_name').val(snapshot.val().package_name);
    $('#package_name').parent().addClass('is-dirty');

    if($('#package_name').val() != '') {
      $('#submitImage').attr("disabled", false);
      $('#submitFeatureImage').attr("disabled", false);
    } else {
      $('#submitImage').attr("disabled", true);
      $('#submitFeatureImage').attr("disabled", true);
    }

    $('#app_icon').val(snapshot.val().app_icon);
    $('#preview-icon').attr('src', snapshot.val().app_icon != '' ? snapshot.val().app_icon : 'images/noPicture.png');
    $('#app_icon').parent().addClass('is-dirty');

    $('#long_description').val(snapshot.val().long_description);
    $('#long_description').parent().addClass('is-dirty');

    $('#short_description').val(snapshot.val().short_description);
    $('#short_description').parent().addClass('is-dirty');

    // set status
    if(snapshot.val().status.toString() == 'true') {
      $('#slideStatus').prop('checked', true);
    } else {
      $('#slideStatus').prop('checked', false);
    }

    reloadRecommendAndPromotion();

    // set recommend checked status
    if(snapshot.val().recommend_apps != 'undefined') {
      var recommend = snapshot.val().recommend_apps;
      var recNode = $('#rec' + id).parent();
      AppManage.copyNodeRecommend = recNode.clone();
      recNode.remove();
        $.each(recommend, function (key, val) {
          $('#rec' + key).prop('checked', true);
          $('#rec_order' + key).val(val.order);
        });
    }

    // set promotion checked status
    if(snapshot.val().promotion_apps != 'undefined') {
      var promotion = snapshot.val().promotion_apps;
      var proNode = $('#pro' + id).parent();
      AppManage.copyNodePromotion = proNode.clone();
      proNode.remove();
        $.each(promotion, function (key, val) {
          $('#pro' + key).prop('checked', true);
          $('#pro_order' + key).val(val.order);
        });
    }

  });

  // Order recommend and promotion default DESC
  sortUsingNestedText($('#recommend'), 'li', 'input.order_class', 'desc');
  sortUsingNestedText($('#promotion'), 'li', 'input.order_class', 'desc');
}

// Order recommend and promotion
function sortUsingNestedText(parent, childSelector, keySelector, type) {
  var items = parent.children(childSelector).sort(function(a, b) {
    var vA = $(keySelector, a).val();
    var vB = $(keySelector, b).val();

    if(type == 'desc') {
      return vB - vA;
    }

    return vA - vB;
  });

  parent.append(items);
}

function reloadRecommendAndPromotion() {
  if(AppManage.copyNodeRecommend != '' && AppManage.copyNodePromotion != '') {

    // Append node
    $('#recommend').get(0).appendChild(AppManage.copyNodeRecommend.get(0));
    $('#promotion').get(0).appendChild(AppManage.copyNodePromotion.get(0));
  }

  $('#recommend').find('li').each(function() {
    $(this).find('input[type=checkbox]').each(function() {
      $(this).prop('checked', false);
    })
    $(this).find('input[type=number]').each(function() {
      $(this).val('');
    })
  });

  $('#promotion').find('li').each(function() {
    $(this).find('input[type=checkbox]').each(function() {
      $(this).prop('checked', false);
    })
    $(this).find('input[type=number]').each(function() {
      $(this).val('');
    })
  });


}

// Sets up shortcuts to Firebase features and initiate firebase auth.
AppManage.prototype.initFirebase = function() {
  // Shortcuts to Firebase SDK features.
  this.auth = firebase.auth();
  this.database = firebase.database();
  this.storage = firebase.storage();
  // Initiates Firebase auth and listen to auth state changes.
  this.auth.onAuthStateChanged(this.onAuthStateChanged.bind(this));
};

// Saves a new message on the Firebase DB.
AppManage.prototype.saveData = function(e) {
  e.preventDefault();

  // Recommend apps
  var recommend = document.getElementById('recommend');
  var child = recommend.getElementsByClassName('check-app');
  var recommendList = {};
  for(var i = 0; i < child.length; i ++) {
    if(child[i].checked) {
      var str = child[i].id;
      var key = str.substring(3, str.length);
      var order = $('#rec_order' + key).val();
      order = ( order == '' || order == 'undefined' ) ? 0 : order;
      recommendList[key] = {order: order, status: "true" };
    }
  }

  // Pormotion apps
  var promotion = document.getElementById('promotion');
  var child = promotion.getElementsByClassName('check-app');
  var promotionList = {};
  for(var i = 0; i < child.length; i ++) {
    if(child[i].checked) {
      var str = child[i].id;
      var key = str.substring(3, str.length);
      var order = $('#pro_order' + key).val();
      order = ( order == '' || order == 'undefined' ) ? 0 : order;
      promotionList[key] = {order: order, status: "true" };
    }
  }

  // Check status
  var status = 'false';
  if(document.getElementById('slideStatus').checked) {
    status = 'true';
  }

  this.messagesRef = this.database.ref('test_apps');

  //varlidate
  if(this.appNameInput.value == '') {
    alert('App name is not null');
    return false;
  }

  if(this.packageName.value == '') {
    alert('Package name is not null');
    return false;
  }

  // Check that the user entered a message and is signed in.
  if (this.appNameInput.value && this.checkSignedInWithData()) {
    var currentUser = this.auth.currentUser;


    //convert package to id
    var id = this.packageName.value.split('.').join('_');
    // Add a new message entry to the Firebase Database.
    this.messagesRef.child(id).set({
      app_feature: this.appFeatureInput.value,
      app_icon: this.appIcon.value,
      app_name: this.appNameInput.value,
      package_name: this.packageName.value,
      long_description: this.longDescription.value,
      short_description: this.shortDescription.value,
      recommend_apps:recommendList,
      promotion_apps:promotionList,
      status: status
    }).then(function() {
      // Clear message text field and SEND button state.
      AppManage.resetMaterialTextfield(this.appNameInput);
      AppManage.resetMaterialTextfield(this.appFeatureInput);
      AppManage.resetMaterialTextfield(this.appIcon);
      AppManage.resetMaterialTextfield(this.longDescription);
      AppManage.resetMaterialTextfield(this.shortDescription);
      AppManage.resetMaterialTextfield(this.packageName);
      $('#preview-icon').attr('src', 'images/noPicture.png');
      $('#preview-feature').attr('src', 'images/noPicture.png');
      location.reload();
    }.bind(this)).catch(function(error) {
      console.error('Error writing new message to Firebase Database', error);
    });
  }
};

// Sets the URL of the given img element with the URL of the image stored in Firebase Storage.
AppManage.prototype.setImageUrl = function(imageUri, imgElement) {
  // If the image is a Firebase Storage URI we fetch the URL.
  if (imageUri.startsWith('gs://')) {
    imgElement.src = AppManage.LOADING_IMAGE_URL; // Display a loading image first.
    this.storage.refFromURL(imageUri).getMetadata().then(function(metadata) {
      imgElement.src = metadata.downloadURLs[0];
    });
  } else {
    imgElement.src = imageUri;
  }
};

// Saves a new message containing an image URI in Firebase.
// This first saves the image in Firebase storage.
AppManage.prototype.saveAppIcon = function(event) {
  var file = event.target.files[0];

  // Clear the selection in the file picker input.
  this.imageForm.reset();

  // Check if the file is an image.
  if (!file.type.match('image.*')) {
    var data = {
      message: 'You can only share images',
      timeout: 2000
    };
    this.signInSnackbar.MaterialSnackbar.showSnackbar(data);
    return;
  }

  // Check if the user is signed-in
  if (this.checkSignedInWithData()) {
    this.messagesRef = this.database.ref('test_apps');
    // We add a message with a loading icon that will get updated with the shared image.
    var currentUser = this.auth.currentUser;
    var id = this.packageName.value.split('.').join('_');

      // Upload the image to Firebase Storage.
      this.storage.ref('test_apps/' + id + '/' + file.name)
          .put(file, {contentType: file.type})
          .then(function(snapshot) {

            // Get the file's Storage URI and update the chat message placeholder.
            var filePath = snapshot.metadata.fullPath;
            firebase.storage().ref().child(filePath).getDownloadURL().then(function(url){
              document.getElementById('app_icon').value = url;
              $('#preview-icon').attr('src', url);
              document.getElementById('app_icon').focus();
              $('#app_icon').parent().addClass('is-dirty');
            });
            //data.update({app_icon: this.storage.ref(filePath).toString()});
          }.bind(this)).catch(function(error) {
            console.error('There was an error uploading a file to Firebase Storage:', error);
          });
    this.appIcon = document.getElementById('app_icon');
  }
};


// Save feature image
AppManage.prototype.saveFeatureImage = function(event) {
  var file = event.target.files[0];

  // Clear the selection in the file picker input.
  this.imageForm.reset();

  // Check if the file is an image.
  if (!file.type.match('image.*')) {
    var data = {
      message: 'You can only share images',
      timeout: 2000
    };
    this.signInSnackbar.MaterialSnackbar.showSnackbar(data);
    return;
  }

  // Check if the user is signed-in
  if (this.checkSignedInWithData()) {
    this.messagesRef = this.database.ref('test_apps');
    // We add a message with a loading icon that will get updated with the shared image.
    var currentUser = this.auth.currentUser;
    var id = this.packageName.value.split('.').join('_');
    // Upload the image to Firebase Storage.
    this.storage.ref('test_apps/' + id + '/' + file.name)
        .put(file, {contentType: file.type})
        .then(function(snapshot) {

          // Get the file's Storage URI and update the chat message placeholder.
          var filePath = snapshot.metadata.fullPath;
          firebase.storage().ref().child(filePath).getDownloadURL().then(function(url){
            document.getElementById('app_feature').value = url;
            $('#preview-feature').attr('src', url);
            document.getElementById('app_feature').focus();
            $('#app_feature').parent().addClass('is-dirty');
          });
          //data.update({app_icon: this.storage.ref(filePath).toString()});
        }.bind(this)).catch(function(error) {
      console.error('There was an error uploading a file to Firebase Storage:', error);
    });
    this.appIcon = document.getElementById('app_feature');
  }
};

// Signs-in App Manage.
AppManage.prototype.signIn = function() {
  // Sign in Firebase using popup auth and Google as the identity provider.
  var provider = new firebase.auth.GoogleAuthProvider();
  this.auth.signInWithPopup(provider);
};

// Signs-out of App Manage.
AppManage.prototype.signOut = function() {
  // Sign out of Firebase.
  this.auth.signOut();
};

// Triggers when the auth state change for instance when the user signs-in or signs-out.
AppManage.prototype.onAuthStateChanged = function(user) {
  if (user) { // User is signed in!
    // Get profile pic and user's name from the Firebase user object.
    var profilePicUrl = user.photoURL;
    var userName = user.displayName;

    // Set the user's profile pic and name.
    this.userPic.style.backgroundImage = 'url(' + (profilePicUrl || '/images/profile_placeholder.png') + ')';
    this.userName.textContent = userName;

    // Show user's profile and sign-out button.
    this.userName.removeAttribute('hidden');
    this.userPic.removeAttribute('hidden');
    this.signOutButton.removeAttribute('hidden');

    // Hide sign-in button.
    this.signInButton.setAttribute('hidden', 'true');

    // We load currently existing chant messages.
    this.loadMessages();

  } else { // User is signed out!
    // Hide user's profile and sign-out button.
    this.userName.setAttribute('hidden', 'true');
    this.userPic.setAttribute('hidden', 'true');
    this.signOutButton.setAttribute('hidden', 'true');

    // Show sign-in button.
    this.signInButton.removeAttribute('hidden');
  }
};

// Returns true if user is signed-in. Otherwise false and displays a message.
AppManage.prototype.checkSignedInWithData = function() {
  // Return true if the user is signed in Firebase
  if (this.auth.currentUser) {
    return true;
  }

  // Display a message to the user using a Toast.
  var data = {
    message: 'You must sign-in first',
    timeout: 2000
  };
  this.signInSnackbar.MaterialSnackbar.showSnackbar(data);
  return false;
};

// Resets the given MaterialTextField.
AppManage.prototype.resetMaterialTextfield = function(element) {
  element.value = '';
  element.parentNode.MaterialTextfield.boundUpdateClassesHandler();
};

// A loading image URL.
AppManage.LOADING_IMAGE_URL = 'https://www.google.com/images/spin-32.gif';

// Displays a Message in the UI.
AppManage.prototype.displayMessage = function(key, val) {
  var defaultImage = val.app_icon != "" ? val.app_icon : 'images/noPicture.png';
  var div = document.getElementById(key);
  if (!div) {
    var container = document.createElement('div');
    container.innerHTML = '<li>'
        + '<input class="check-app" type="checkbox" id="rec' + key + '" />'
        + '<label title="'+ val.app_name +'" class="label-checkbox" for="rec' + key + '"><img src="' + defaultImage +'" /></label>'
        + '<input class="order_class" type="number" id="rec_order' + key + '"/>'
        + '</li>';
    div = container.firstChild;
    this.recommend.appendChild(div);
  }

  var div2 = document.getElementById(key);
  if (!div2) {
    var container2 = document.createElement('div');
    container2.innerHTML = '<li>'
        + '<input class="check-app" type="checkbox" id="pro' + key + '" />'
        + '<label title="'+ val.app_name +'" class="label-checkbox" for="pro' + key + '"><img src="' + defaultImage +'" /></label>'
        + '<input class="order_class" type="number" id="pro_order' + key + '"/>'
        + '</li>';
    div2 = container2.firstChild;
    this.promotion.appendChild(div2);
  }
};

// Checks that the Firebase SDK has been correctly setup and configured.
AppManage.prototype.checkSetup = function() {
  if (!window.firebase || !(firebase.app instanceof Function) || !window.config) {
    window.alert('You have not configured and imported the Firebase SDK. ' +
        'Make sure you go through the codelab setup instructions.');
  } else if (config.storageBucket === '') {
    window.alert('Your Firebase Storage bucket has not been enabled. Sorry about that. This is ' +
        'actually a Firebase bug that occurs rarely. ' +
        'Please go and re-generate the Firebase initialisation snippet (step 4 of the codelab) ' +
        'and make sure the storageBucket attribute is not empty. ' +
        'You may also need to visit the Storage tab and paste the name of your bucket which is ' +
        'displayed there.');
  }
};

window.onload = function() {
  window.AppManage = new AppManage();
};
