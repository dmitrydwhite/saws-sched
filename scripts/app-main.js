function shelterDay(d) {
  var days = [ 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var p = (d.period && new Date(d.period.replace('-0', '-'))) || {};

  return '' +
    '<div class="sd" data-id="' + d.id + '">' +
      '<div class="sd-header">' +
        '<div class="sd-dow">' + days[p.getDay()] + '</div>' +
        '<div class="sd-date">' + months[p.getMonth()] + ' ' + p.getDate() + '</div>' +
        '<div class="sd-status">' + (d.open ? 'OPEN' : 'CLOSED') + '</div>' +
      '</div>' +
      '<div class="sd-staffing">' +
        '<div class="sd-breakfast">Breakfast: ' + (d.brk.displayName || sButton('brk', d.id)) + '</div>' +
        '<div class="sd-ev-lead">Evening Lead: ' + (d.evLead.displayName || sButton('evLead', d.id)) + '</div>' +
        '<div class="sd-ev-second">Evening Second: ' + (d.evSecond.displayName || sButton('evSecond', d.id)) + '</div>' +
        '<div class="sd-ov-lead">Overnight Lead: ' + (d.ovLead.displayName || sButton('ovLead', d.id)) + '</div>' +
        '<div class="sd-ov-second">Overnight Second: ' + (d.ovSecond.displayName || sButton('ovSecond', d.id)) + '</div>' +
      '</div>' +
    '</div>' +
  '';
}

function sButton(type, id) {
  return '<button data-id= "' + id + '" class="sign-up" data-type="' + type + '">Sign Up</button>';
}


function AppExecute(firebase) {
  // Initialize vars
  var admins = ['xLpwSqQqSfdWcBZDhhymNmp4qZD2'];
  var scheduleDays = firebase.database().ref('/scheduleDays/');
  var isAdmin;




  function showDays(dayz) {
    var markup = '';

    dayz.forEach(function (sDay) {
      var d = sDay.exportVal();

      d.id = sDay.key;
      markup += d && shelterDay(d);
    });

    markup += isAdmin ?
      '<button id="add-days">OPEN MORE DAYS</button>' : '';

    document.getElementById('scheduler').innerHTML = markup;

    Array.prototype.slice.call(document.getElementsByClassName('sign-up')).forEach(function (signupBtn) {
      signupBtn.addEventListener('click', signMeUpForThis);
    });

    document.getElementById('add-days').addEventListener('click', addMoreDays);
  }

  function signMeUpForThis(evt) {
    evt.preventDefault();

    var shift = evt.currentTarget;
    var shiftType = shift.getAttribute('data-type');
    var shiftDate = shift.getAttribute('data-id');
    var currUser = firebase.auth().currentUser;
    var updateObj = {};

    updateObj = {
      displayName: currUser.displayName.split(' ')[0] + currUser.displayName.split(' ')[1][1],
      userId: currUser.uid
    };

    firebase.database().ref('scheduleDays/' + shiftDate + '/' + shiftType).set(updateObj);
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

    var nextDate = evt.currentTarget.getElementsByTagName('input')[0].value;

    var nextOpen = {
      period: nextDate,
      open: true,
      brk: { displayName: '', userId: '' },
      evLead: { displayName: '', userId: '' },
      evSecond: { displayName: '', userId: '' },
      ovLead: { displayName: '', userId: '' },
      ovSecond: { displayName: '', userId: '' },
    };

    scheduleDays.push(nextOpen);
  }

  function startApp() {
    isAdmin = firebase.auth().currentUser && admins.indexOf(firebase.auth().currentUser.uid) > -1;

    scheduleDays.on('value', showDays);
  }

  // Check the user state
  firebase.auth().onAuthStateChanged((user) => {
    if (!user) {
      firebase.auth().signInWithPopup(new firebase.auth.GoogleAuthProvider())
        .then(startApp);
    } else {
      startApp();
    }
  });
}

AppExecute(firebase);