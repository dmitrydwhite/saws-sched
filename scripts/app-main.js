var days = [ 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];


function AppExecute(firebase) {
  // Initialize vars
  var admins = ['xLpwSqQqSfdWcBZDhhymNmp4qZD2', 'CHI5mb6Q82V9OuI85inc2L5C8eG2', 'VkD6EqlXOggGErT150dGlNUmH992'];
  // var admins = [];
  var scheduleDays = firebase.database().ref('/scheduleDays/');
  var isAdmin;
  var cUser;
  var showAllDays;
  var DAYS_REF = [];
  var showMyDays = false;

  function shelterDay(d) {
    var p = (d.period && new Date(d.period.replace('-0', '-'))) || {};
  
    return '' +
      '<div class="sd" data-id="' + d.id + '">' +
        '<div class="sd-header">' +
          (isAdmin ?
            '<div data-current="' +
              d.open + '" data-id="' + d.id + '" class="close-button"><i class="material-icons">'+
              (d.open ? 'thumb_down' : 'thumb_up') +
              '</i></div>' :
            '') +
          '<div class="sd-dow">' + days[p.getDay()] + '</div>' +
          '<div class="sd-date">' + months[p.getMonth()] + ' ' + p.getDate() + '</div>' +
          '<div class="sd-status">' + (d.open ? 'OPEN' : 'CLOSED') + '</div>' +
        '</div>' +
        '<div class="sd-staffing">' +
        '<div class="sd-oncall-mgr">' + d.onCallMgr.displayText + ': ' + sButton(d.onCallMgr.displayName, d.onCallMgr.volId, 'onCallMgr', d.id) + '</div>' +
        '<div class="sd-ev-lead">' + d.evLead.displayText + ': ' + sButton(d.evLead.displayName, d.evLead.volId, 'evLead', d.id) + '</div>' +
        '<div class="sd-ev-second">' + d.evSecond.displayText + ': ' + sButton(d.evSecond.displayName, d.evSecond.volId, 'evSecond', d.id) + '</div>' +
        '<div class="sd-ov-lead">' + d.ovLead.displayText + ': ' + sButton(d.ovLead.displayName, d.ovLead.volId, 'ovLead', d.id) + '</div>' +
        '<div class="sd-ov-second">' + d.ovSecond.displayText + ': ' + sButton(d.ovSecond.displayName, d.ovSecond.volId, 'ovSecond', d.id) + '</div>' +
        '<div class="sd-breakfast">' + d.brk.displayText + ': ' + sButton(d.brk.displayName, d.brk.volId, 'brk', d.id) + '</div>' +
        '</div>' +
      '</div>' +
    '';
  }

  function sButton(displayName, uid, type, id) {
    var detailString = 'data-id= "' + id + '" data-type="' + type + '"';
    var signupButton = '<button ' + detailString + ' class="sign-up">Sign Up</button>';
    var justName = (uid !== cUser.uid && !isAdmin) ?
      displayName :
      displayName + '  <a ' + detailString + ' href="#" class="cancel-link">cancel</a>';
  
    return displayName ? justName : signupButton;
  }

  function translateUpdatedDays(dayz) {
    DAYS_REF = [];

    dayz.forEach(function (day) {
      d = day.exportVal();
      d.id = day.key;
      DAYS_REF.push(d);
    });

    if (showMyDays) {
      showUserShifts();
    } else {
      showDays();
    }
  }

  function showDays() {
    var rightNow = Date.now();
    var dayItems = [];
    var markup = '';

    showMyDays = false;

    DAYS_REF.forEach(function (d) {
      // var d = sDay.exportVal();
      var dayToCome = new Date(d.period).valueOf();

      if (showAllDays || (d && dayToCome > rightNow && d.open)) {
        // d.id = sDay.key;
        dayItems.push(d);
      }
    });

    // Show all the sheduled days that meet the criteria.
    markup = dayItems
      .sort(function (a, b) { return a.order > b.order; })
      .map(function (dayObj) { return shelterDay(dayObj); })
      .join('');

    // Prepend the messaging.
    if (dayItems.length) {
      markup = '' +
        '<p class="centered-msg">The Silverton Area Warming shelter is now activated for the following dates.</p>' +
        '<p class="centered-msg">Please select the shift that works best for you. Thank you!</p>' +
        markup;
    } else {
      markup = '' +
        '<p class="centered-msg">The Silverton Area Warming shelter currently has no open dates scheduled.</p>' +
        markup;
    }

    // Add the Admin tools.
    if (isAdmin) {
      markup = markup +
      '<div class="button-container"><button id="add-days">OPEN MORE DAYS</button></div>' +
      '<div class="button-container"><button id="show-all-days">' +
        (showAllDays ?
          'HIDE' : 'SHOW') +
        ' CLOSED AND PAST DATES</button></div>' +
      '';
    }

    // Add the Show My Shifts button for everybody.
    markup = markup +
      '<div class="button-container"><button id="show-my-shifts" data-uid="' + cUser.uid + '">SHOW MY SHIFTS</button></div>';

    // Add the full markup string to the scheduler element:
    document.getElementById('scheduler').innerHTML = markup;

    // Set listeners on each individual interaction...
    document.getElementById('show-my-shifts').addEventListener('click', showUserShifts);
    Array.prototype.slice.call(document.getElementsByClassName('sign-up')).forEach(function (signupBtn) {
      signupBtn.addEventListener('click', signMeUpForThis);
    });
    Array.prototype.slice.call(document.getElementsByClassName('cancel-link')).forEach(function (cancelLink) {
      cancelLink.addEventListener('click', cancelUser);
    });

    // Set listeners on admin tools.
    if (isAdmin) {
      document.getElementById('add-days').addEventListener('click', addMoreDays);
      document.getElementById('show-all-days').addEventListener('click', toggleShowAllDays);
      Array.prototype.slice.call(document.getElementsByClassName('close-button')).forEach(function (closer) {
        closer.addEventListener('click', toggleOpenState);
      });
    }
  }

  function toggleShowAllDays() {
    showAllDays = !showAllDays;
    showDays();
  }

  function toggleOpenState(evt) {
    evt.preventDefault();

    var btn = evt.currentTarget;

    var date = btn.getAttribute('data-id');
    var isOpen = btn.getAttribute('data-current') === 'true';

    firebase.database().ref('scheduleDays/' + date).update({ open: !isOpen });

    if (isOpen) { notifyShiftMembersOfClosing(date); }
  }

  function notifyShiftMembersOfClosing(dateId) {
    if (console) console.log('notifying shift members of closing');
    /**
     * NO OP; RESERVED FOR TEXT MESSAGE INTEGRATION.
     */
  }

  function notifyShiftMembersOfReOpening(dateId) {
    if (console) console.log('notifying previous shift members of opening');
    /**
     * NO OP; RESERVED FOR TEXT MESSAGE INTEGRATION.
     */
  }

  function cancelUser(evt) {
    evt.preventDefault();

    var shift = evt.currentTarget;
    var shiftType = shift.getAttribute('data-type');
    var shiftDate = shift.getAttribute('data-id');

    firebase.database()
      .ref('scheduleDays/' + shiftDate + '/' + shiftType)
      .update({ smsReminderSent: false, volId: '', displayName: '' });
  }

  function signMeUpForThis(evt) {
    evt.preventDefault();

    var shift = evt.currentTarget;
    var shiftType = shift.getAttribute('data-type');
    var shiftDate = shift.getAttribute('data-id');
    var updateObj = {
      displayName: cUser.displayName.split(' ')[0] + ' ' + cUser.displayName.split(' ')[1][0],
      volId: cUser.uid
    };

    firebase.database().ref('scheduleDays/' + shiftDate + '/' + shiftType).update(updateObj);
  }

  function addMoreDays(evt) {
    var addDaysForm = document.createElement('form');
    var today = new Date();

    evt.currentTarget.setAttribute('disabled', true);
    evt.currentTarget.setAttribute('style', 'display: none;');

    addDaysForm.id = 'create-days';

    addDaysForm.innerHTML = '' +
      '<label>Add a Date to Open</label><input required type="date" ' +
      'value="' + today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + (today.getDate() + 1) + '"' +
      '><button type="submit">OPEN</button>' +
    '';

    evt.currentTarget.insertAdjacentElement('beforebegin', addDaysForm);

    document.getElementById('create-days').addEventListener('submit', addMoreOpenDays);
  }

  function addMoreOpenDays(evt) {
    evt.preventDefault();

    var nextDate = evt.currentTarget.getElementsByTagName('input')[0].value.replace(/-0?/g, '/');
    var nextDateObj = new Date(nextDate);

    var nextOpen = {
      order: nextDateObj.valueOf(),
      period: nextDate,
      open: true,
      brk: {
        displayName: '',
        displayText: 'Breakfast on ' + months[nextDateObj.getMonth()] + ' ' + (nextDateObj.getDate() + 1),
        volId: '',
      },
      onCallMgr: { displayName: '', displayText: 'On-Call Manager', volId: '' },
      evLead: { displayName: '', displayText: 'Evening Lead', volId: '' },
      evSecond: { displayName: '', displayText: 'Evening Volunteer', volId: '' },
      ovLead: { displayName: '', displayText: 'Overnight Lead', volId: '' },
      ovSecond: { displayName: '', displayText: 'Overnight Volunteer', volId: '' },
    };
    var alreadyHaveDate = DAYS_REF.map(function (day) { return day.period; }).indexOf(nextOpen.period);

    if (alreadyHaveDate > -1) {
      var dayToUpdate = DAYS_REF[alreadyHaveDate].id;

      // Making this logic check here to avoid re-notifying someone if an admin accidentally
      // tries to open an already-open day.
      if (!DAYS_REF[alreadyHaveDate].open) { notifyShiftMembersOfReOpening(dayToUpdate); }

      firebase.database().ref('scheduleDays/' + dayToUpdate).update({ open: true });
    } else {
      scheduleDays.push(nextOpen);
    }
  }

  function showUserShifts() {
    var shiftOrder = ['onCallMgr', 'evLead', 'evSecond', 'ovLead', 'ovSecond', 'brk'];
    var rightNow = Date.now();
    var markup = '';
    var userShifts = [];

    showMyDays = true;

    DAYS_REF.forEach(function (sDay) {
      if (new Date(sDay.period).valueOf() > rightNow && sDay.open) {
        shiftOrder.forEach(function (shift) {
          if (sDay[shift].volId === cUser.uid) {
            var shiftRefObj = new Object(sDay[shift]);
            var shiftRefDate = new Date(sDay.period);

            shiftRefObj.id = sDay.id;
            shiftRefObj.type = shift;
            shiftRefObj.dateText = '' + months[shiftRefDate.getMonth()] + ' ' + shiftRefDate.getDate();
            shiftRefObj.sortOrder = '' + shiftRefDate.valueOf() + shiftOrder.indexOf('shift');

            userShifts.push(shiftRefObj);
          }
        });
      }
    });

    markup = userShifts.length ? userShifts
      .sort(function (a, b) { return a.sortOrder > b.sortOrder; })
      .map(function (shiftRef) { return shiftMarkup(shiftRef); })
      .join('') :
      '<p>No shifts scheduled</p>';

    markup += '<div class="button-container"><button id="show-overall-sched">SHOW SHELTER SCHEDULE</button></div>';

    document.getElementById('scheduler').innerHTML = markup;


    document.getElementById('show-overall-sched').addEventListener('click', showDays);
    Array.prototype.slice.call(document.getElementsByClassName('shift-detail-cancel'))
      .forEach(function (cancelLink) {
        cancelLink.addEventListener('click', cancelUser);
      });
  }

  function shiftMarkup(shift) {
    return '' +
      '<div class="shift-detail"><p>' + shift.displayName + ' is scheduled for</p><p>' + shift.displayText +
        '</p><p>for the shelter night of ' + shift.dateText +
        ' <a href="#" data-id="' + shift.id + '" data-type="' + shift.type + '"' +
        ' class="shift-detail-cancel">cancel</a>' +
      '</p></div>' +
      '';
  }

  function setLoginDivTo(state) {
    var loginDiv = document.getElementById('firebaseui-auth-container');

    if (loginDiv) {
      loginDiv.style.display = state;
    } else {
      window.addEventListener('load', function () {
        document.getElementById('firebaseui-auth-container').style.display = state;
      });
    }
  }

  function startApp() {
    cUser = firebase.auth().currentUser;

    isAdmin = cUser && admins.indexOf(cUser.uid) > -1;

    scheduleDays.on('value', translateUpdatedDays);
  }

  function addUserPhone(evt) {
    
    var userId = evt.currentTarget.getAttribute('data-id');
    var userPhone = evt.currentTarget.getElementsByTagName('input')[0].value;
    
    if (userPhone) evt.preventDefault();

    if (/^\d\d\d\d\d\d\d\d\d\d$/.test(userPhone)) {
      firebase.database().ref('userPhones/' + userId).set('1' + userPhone);
      startApp();
    } else {
      evt.currentTarget.getElementsByTagName('input')[0].value = '';
      evt.currentTarget.getElementsByTagName('input')[0].placeholder = '⚠️ Invalid Phone Number';
      evt.currentTarget.getElementsByTagName('input')[0].style.border = '1px solid red';
      evt.currentTarget.getElementsByTagName('input')[0].addEventListener('focus', function () {
        this.style.border = '1px solid lightgray';
        this.placeholder = 'Enter SMS Phone';
      });
    }
  }

  function verifyPhone(user) {
    firebase.database().ref('userPhones/' + user.uid).once('value').then(function(userPhone) {
      if (userPhone.exportVal()) {
        startApp();
      } else if (user.phoneNumber) {
        firebase.database().ref('userPhones/' + user.uid).set(user.phoneNumber);
        startApp();
      } else {
        var markup = '' +
          '<form id="add-phone" data-id="' + user.uid +'">' +
            '<p>You do not appear to have a phone number associated with your account.</p>' +
            '<p>The Silverton Area Warming Shelter (SAWS) scheduling app requires you to provide a phone ' +
            'number where you can receive SMS or text message reminders.</p>' +
            '<p>SAWS will not share your phone number with any other entity, and will only use it to send SMS text reminders ' +
            'for scheduled volunteer shifts.</p>' +
            '<p>Please enter your ten-digit phone number using numbers only, without parentheses or dashes.  Thank you!</p>' +
            '<div class="phone-input-container">' +
              '<input required type="tel" placeholder="Enter SMS Phone"/>' +
            '</div>' +
            '<div class="button-container"><button type="submit">ADD PHONE</button></div>' +
          '</form>' +
        '';
  
        document.getElementById('scheduler').innerHTML = markup;
  
        document.getElementById('add-phone').addEventListener('submit', addUserPhone);
      }
    });
  }

  // Check the user state
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      setLoginDivTo('none');
      verifyPhone(user);
    } else {
      // FirebaseUI config.
      var uiConfig = {
        signInSuccessUrl: '#',
        signInOptions: [
          firebase.auth.GoogleAuthProvider.PROVIDER_ID,
          firebase.auth.FacebookAuthProvider.PROVIDER_ID,
        ],
      };

      // Initialize the FirebaseUI Widget using Firebase.
      var ui = new firebaseui.auth.AuthUI(firebase.auth());
      // The start method will wait until the DOM is loaded.
      setLoginDivTo('initial');
      ui.start('#firebaseui-auth-container', uiConfig);
    }
  });
}

AppExecute(firebase);