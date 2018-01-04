var days = [ 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];


function AppExecute(firebase) {
  // Initialize vars
  var admins = ['xLpwSqQqSfdWcBZDhhymNmp4qZD2'];
  // var admins = [];
  var scheduleDays = firebase.database().ref('/scheduleDays/');
  var isAdmin;
  var cUser;
  var showAllDays;
  var DAYS_REF = [];

  function shelterDay(d) {
    var p = (d.period && new Date(d.period.replace('-0', '-'))) || {};
  
    return '' +
      '<div class="sd" data-id="' + d.id + '">' +
        '<div class="sd-header">' +
          (isAdmin ?
            '<div data-current="' +
              d.open + '" data-id="' + d.id + '" class="close-button"><i class="material-icons">thumb_down</i></div>' :
            '') +
          '<div class="sd-dow">' + days[p.getDay()] + '</div>' +
          '<div class="sd-date">' + months[p.getMonth()] + ' ' + p.getDate() + '</div>' +
          '<div class="sd-status">' + (d.open ? 'OPEN' : 'CLOSED') + '</div>' +
        '</div>' +
        '<div class="sd-staffing">' +
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

  function showDays(dayz) {
    var rightNow = Date.now();
    var dayItems = [];
    var markup = '';

    DAYS_REF = [];

    // Store the updated value locally for some manipulation protections later on.
    dayz.forEach(function (sDay) {
      var r = sDay.exportVal();

      r.id = sDay.key;
      DAYS_REF.push(r);
    });

    dayz.forEach(function (sDay) {
      var d = sDay.exportVal();
      var dayToCome = new Date(d.period).valueOf();

      if (d && dayToCome > rightNow && d.open) {
        d.id = sDay.key;
        dayItems.push(d);
      }
    });

    markup = dayItems
      .sort(function (a, b) { return a.order > b.order; })
      .map(function (dayObj) { return shelterDay(dayObj); })
      .join('');

    if (dayItems.length) {
      markup = '' +
        '<p>The Silverton Area Warming shelter is now activated for the following dates. Please select the shift that works best for you. Thank you!<p>' +
        markup;
    } else {
      markup = '' +
        '<p>The Silverton Area Warming shelter currently has no open dates scheduled.</p>' +
        markup;
    }

    if (isAdmin) {
      markup = markup +
      '<div class="add-more-days-container"><button id="add-days">OPEN MORE DAYS</button></div>' +
      '';
    }

    document.getElementById('scheduler').innerHTML = markup;

    Array.prototype.slice.call(document.getElementsByClassName('sign-up')).forEach(function (signupBtn) {
      signupBtn.addEventListener('click', signMeUpForThis);
    });

    Array.prototype.slice.call(document.getElementsByClassName('cancel-link')).forEach(function (cancelLink) {
      cancelLink.addEventListener('click', cancelUser);
    });

    if (isAdmin) {
      document.getElementById('add-days').addEventListener('click', addMoreDays);
      Array.prototype.slice.call(document.getElementsByClassName('close-button')).forEach(function (closer) {
        closer.addEventListener('click', toggleOpenState);
      });
    }
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
    /**
     * NO OP; RESERVED FOR TEXT MESSAGE INTEGRATION.
     */
  }

  function cancelUser(evt) {
    evt.preventDefault();

    var shift = evt.currentTarget;
    var shiftType = shift.getAttribute('data-type');
    var shiftDate = shift.getAttribute('data-id');

    firebase.database().ref('scheduleDays/' + shiftDate + '/' + shiftType).update({ volId: '', displayName: '' });
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

    addDaysForm.id = 'create-days';

    addDaysForm.innerHTML = '' +
      '<label>Add a Date to Open</label><input required type="date" ' +
      'value="' + today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + (today.getDate() + 1) + '"' +
      '><button type="submit">ADD</button>' +
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
        userId: '',
        displayText: 'Breakfast on ' + months[nextDateObj.getMonth()] + ' ' + (nextDateObj.getDate() + 1),
        volId: '',
      },
      evLead: { displayName: '', displayText: 'Evening Lead', volId: '' },
      evSecond: { displayName: '', displayText: 'Evening Second', volId: '' },
      ovLead: { displayName: '', displayText: 'Overnight Lead', volId: '' },
      ovSecond: { displayName: '', displayText: 'Overnight Second', volId: '' },
    };
    var alreadyHaveDate = DAYS_REF.map(function (day) { return day.period; }).indexOf(nextOpen.period);

    if (alreadyHaveDate > -1) {
      var dayToUpdate = DAYS_REF[alreadyHaveDate].id;
      firebase.database().ref('scheduleDays/' + dayToUpdate).update({ open: true });
    } else {
      scheduleDays.push(nextOpen);
    }
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

    scheduleDays.on('value', showDays);
  }

  // Check the user state
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      startApp();
      setLoginDivTo('none');
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