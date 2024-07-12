
    function changeTheme(themeBool) {
      var theme = document.getElementsByTagName('body')[0].getAttribute('data-bs-theme');
      if (theme == 'dark') {
        document.getElementsByTagName('body')[0].setAttribute('data-bs-theme', 'light');
        themeBool = true;

        let params = {
          theme: "light"
        };
        let searchParams = new URLSearchParams(params);
        let newURL = window.location.protocol + "//" + window.location.host + window.location.pathname + "?" + searchParams.toString();
        window.history.pushState({ path: newURL }, '', newURL);

      } else {
        document.getElementsByTagName('body')[0].setAttribute('data-bs-theme', 'dark');
        themeBool = false;

        let params = {
          theme: "dark"
        };
        let searchParams = new URLSearchParams(params);
        let newURL = window.location.protocol + "//" + window.location.host + window.location.pathname + "?" + searchParams.toString();
        window.history.pushState({ path: newURL }, '', newURL);
      }
    }
    function checkTheme(themeArg) {
      var theme = document.getElementsByTagName('body')[0].getAttribute('data-bs-theme');
      if(themeArg!=theme) changeTheme();
    }