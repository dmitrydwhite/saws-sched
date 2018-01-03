var days = [ 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];


function AppExecute(firebase) {
  // Initialize vars
  // var admins = ['xLpwSqQqSfdWcBZDhhymNmp4qZD2'];
  var admins = [];
  var scheduleDays = firebase.database().ref('/scheduleDays/');
  var isAdmin;
  var cUser;

  function shelterDay(d) {
    var p = (d.period && new Date(d.period.replace('-0', '-'))) || {};
  
    return '' +
      '<div class="sd" data-id="' + d.id + '">' +
        '<div class="sd-header">' +
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
    var dayItems = [];
    var markup = '';

    dayz.forEach(function (sDay) {
      var d = sDay.exportVal();

      if (d) {
        d.id = sDay.key;
        dayItems.push(d);
      }
    });

    markup = dayItems
      .sort(function (a, b) { return a.order > b.order; })
      .map(function (dayObj) { return shelterDay(dayObj); })
      .join('');

    markup += isAdmin ?
      '<button id="add-days">OPEN MORE DAYS</button>' : '';

    document.getElementById('scheduler').innerHTML = markup;

    Array.prototype.slice.call(document.getElementsByClassName('sign-up')).forEach(function (signupBtn) {
      signupBtn.addEventListener('click', signMeUpForThis);
    });

    Array.prototype.slice.call(document.getElementsByClassName('cancel-link')).forEach(function (cancelLink) {
      cancelLink.addEventListener('click', cancelUser);
    });

    document.getElementById('add-days').addEventListener('click', addMoreDays);
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

    var nextDate = evt.currentTarget.getElementsByTagName('input')[0].value.replace('-0', '-');
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

    scheduleDays.push(nextOpen);
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
      document.getElementById('firebaseui-auth-container').style.display = 'none';
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
      document.getElementById('firebaseui-auth-container').style.display = 'initial';
      ui.start('#firebaseui-auth-container', uiConfig);
    }
  });
}

AppExecute(firebase);