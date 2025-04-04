document.addEventListener("DOMContentLoaded", () => {
  // Inizializza AOS (Animate On Scroll)
  AOS.init({
    duration: 800,
    easing: "ease",
    once: true,
    offset: 100,
    disable: "mobile", // Disabilita su dispositivi mobili per migliorare le prestazioni
  })

  // Elementi UI 
  const loginModal = document.getElementById("loginModal")
  const registerModal = document.getElementById("registerModal")
  const loginButton = document.getElementById("loginButton")
  const registerButton = document.getElementById("registerButton")
  const closeButtons = document.querySelectorAll(".close")
  const loginForm = document.getElementById("loginForm")
  const registerForm = document.getElementById("registerForm")
  const contactForm = document.getElementById("contactForm")
  const loginError = document.getElementById("loginError")
  const registerError = document.getElementById("registerError")
  const userInfo = document.getElementById("userInfo")
  const welcomeUser = document.getElementById("welcomeUser")
  const logoutButton = document.getElementById("logoutButton")
  const authButtons = document.getElementById("authButtons")
  const showRegisterLink = document.getElementById("showRegisterLink")
  const showLoginLink = document.getElementById("showLoginLink")
  const downloadButtons = document.querySelectorAll(".download-btn, .archive-item")
  const toast = document.getElementById("toast")

  // Stato dell'autenticazione
  let isAuthenticated = false
  let currentUser = null

  // Inizializza il localStorage se non esiste
  if (!localStorage.getItem("users")) {
    localStorage.setItem("users", JSON.stringify([]))
  }

  // Funzione per hashare le password usando SHA-256
  async function hashPassword(password) {

    // Converte la stringa della password in un array di byte
    const encoder = new TextEncoder()
    const data = encoder.encode(password)

    // Usa l'API Web Crypto per creare un hash SHA-256
    const hashBuffer = await crypto.subtle.digest("SHA-256", data)

    // Converti il buffer in una stringa esadecimale
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")

    return hashHex
  }

  // Funzione per mostrare l'indicatore di forza della password
  const passwordInput = document.getElementById("registerPassword")
  const passwordStrength = document.getElementById("passwordStrength")
  const passwordFeedback = document.getElementById("passwordFeedback")

  // Funzione per valutare la forza della password
  function evaluatePasswordStrength(password) {
    // Inizializzazione del punteggio 
    let score = 0

    // Verifica di lunghezza minima
    if (password.length >= 8) score += 1
    if (password.length >= 12) score += 1

    // Complessità
    if (/[A-Z]/.test(password)) score += 1 // Maiuscole
    if (/[a-z]/.test(password)) score += 1 // Minuscole
    if (/[0-9]/.test(password)) score += 1 // Numeri
    if (/[^A-Za-z0-9]/.test(password)) score += 1 // Caratteri speciali

    // Valuta il punteggio
    if (score < 3)
      return { strength: "weak", message: "Password debole: aggiungi numeri, lettere maiuscole o caratteri speciali" }
    if (score < 5) return { strength: "medium", message: "Password media: puoi migliorarla" }
    return { strength: "strong", message: "Password forte" }
  }

  // Evento che valuta la password in tempo reale durante la registrazione
  if (passwordInput && passwordStrength && passwordFeedback) {
    passwordInput.addEventListener("input", function () {
      const password = this.value

      if (password.length === 0) {
        passwordStrength.className = "password-strength"
        passwordFeedback.textContent = "La password deve contenere almeno 8 caratteri"
        return
      }

      const evaluation = evaluatePasswordStrength(password)

      // Aggiorna l'indicatore visivo
      passwordStrength.className = "password-strength " + evaluation.strength
      passwordFeedback.textContent = evaluation.message
    })
  }

  // Controlla se l'utente è già autenticato (usando sessionStorage)
  function checkAuthentication() {
    const storedUser = sessionStorage.getItem("currentUser")
    if (storedUser) {
      currentUser = JSON.parse(storedUser)
      isAuthenticated = true
      updateUIForAuthenticatedUser()
    }
  }

  // Aggiorna l'interfaccia per un utente autenticato
  function updateUIForAuthenticatedUser() {
    authButtons.style.display = "none"
    userInfo.style.display = "flex"
    welcomeUser.textContent = `Benvenuto, ${currentUser.name}`

    // Aggiorna l'aspetto dei report protetti
    document.querySelectorAll(".protection-badge").forEach((badge) => {
      badge.innerHTML = '<i class="fas fa-unlock"></i> Accesso consentito'
      badge.style.backgroundColor = "#5bc0de"
    })
  }

  // Gestione del form di registrazione 
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault()

      const name = document.getElementById("registerName").value
      const email = document.getElementById("registerEmail").value
      const password = document.getElementById("registerPassword").value
      const passwordConfirm = document.getElementById("registerPasswordConfirm").value
      const termsAccepted = document.getElementById("termsAccept").checked

      // Validazione del form
      if (password !== passwordConfirm) {
        registerError.textContent = "Le password non corrispondono."
        return
      }

      if (password.length < 8) {
        registerError.textContent = "La password deve contenere almeno 8 caratteri."
        return
      }

      if (!termsAccepted) {
        registerError.textContent = "Devi accettare i Termini e Condizioni."
        return
      }

      // Verifica se l'email è già registrata
      const users = JSON.parse(localStorage.getItem("users"))
      if (users.some((user) => user.email === email)) {
        registerError.textContent = "Questa email è già registrata."
        return
      }

      try {

        // Hashing della password prima di salvarla
        const hashedPassword = await hashPassword(password)

        // Registrazione del nuovo utente con la password hashata
        const newUser = {
          id: Date.now().toString(),
          name,
          email,
          password: hashedPassword, // Password hashata
          passwordVersion: "sha256", // Indica il metodo di hashing usato
          registeredAt: new Date().toISOString(),
        }
        
        // Salvataggio dell'utente nel localStorage
        users.push(newUser)
        localStorage.setItem("users", JSON.stringify(users)) 

        // Mostra un messaggio di successo
        showToast("Registrazione completata con successo! Ora puoi accedere.", "success")

        // Chiusura del modal di registrazione e apertura di quello di login
        registerModal.style.display = "none"
        loginModal.style.display = "flex"

        // Pre-compila l'email nel form di login
        document.getElementById("loginEmail").value = email
        document.getElementById("loginPassword").value = ""

        // Resetta il form di registrazione
        registerForm.reset()
        registerError.textContent = ""
      } catch (error) {
        console.error("Errore durante l'hashing della password:", error) // Log dell'errore
        registerError.textContent = "Si è verificato un errore durante la registrazione. Riprova." // Messaggio di errore
      }
    })
  }

  // Apporto modifiche della gestione del login per verificare la password hashata
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault()

      const email = document.getElementById("loginEmail").value
      const password = document.getElementById("loginPassword").value

      // Verifica le credenziali dell'utente
      const users = JSON.parse(localStorage.getItem("users"))
      const user = users.find((u) => u.email === email)

      if (!user) {
        loginError.textContent = "Email o password non validi. Riprova."
        return
      }

      try {
        let isValidPassword = false

        // Controlla se l'utente ha una password hashata (utenti nuovi)
        if (user.passwordVersion === "sha256") {
          const hashedPassword = await hashPassword(password)
          isValidPassword = user.password === hashedPassword
        } else {
          // Supporto per utenti esistenti con password non hashate
          isValidPassword = user.password === password

          // Opzionale: aggiorna la password al nuovo formato hashato
          if (isValidPassword) {
            const hashedPassword = await hashPassword(password)
            user.password = hashedPassword
            user.passwordVersion = "sha256"
            localStorage.setItem("users", JSON.stringify(users))
          }
        }

        if (isValidPassword) {
          // Autenticazione riuscita
          isAuthenticated = true
          currentUser = user

          // Salva lo stato di autenticazione nella sessione
          sessionStorage.setItem("currentUser", JSON.stringify(user))

          // Aggiorna l'UI
          updateUIForAuthenticatedUser()

          // Chiudi il modal
          loginModal.style.display = "none"

          // Mostra un messaggio di successo
          showToast(`Benvenuto, ${user.name}!`, "success")

          // Ricarica AOS per animare gli elementi che potrebbero essere stati aggiunti o modificati
          setTimeout(() => {
            AOS.refresh()
          }, 500)
        } else {
          loginError.textContent = "Email o password non validi. Riprova."
        }
      } catch (error) {
        console.error("Errore durante la verifica della password:", error) 
        loginError.textContent = "Si è verificato un errore durante l'accesso. Riprova."
      }
    })
  }

  // Gestione del form di contatto con Web3Forms
  if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault()

      // Elementi UI
      const submitBtn = contactForm.querySelector("button[type=submit]")
      const submitText = contactForm.querySelector(".submit-text")
      const loadingText = contactForm.querySelector(".loading-text")
      const resultElement = document.getElementById("result")

      // Disabilita il pulsante e mostra l'indicatore di caricamento
      submitBtn.disabled = true
      submitText.style.display = "none"
      loadingText.style.display = "inline-block"

      // Raccogli i dati del form
      const formData = new FormData(contactForm)

      // Invia i dati a Web3Forms
      fetch("https://api.web3forms.com/submit", { // URL del servizio Web3Forms
        method: "POST",
        body: formData, // Invia i dati del form
      })
        .then(async (response) => {
          const json = await response.json()

          if (response.status == 200) {
            
            // Successo
            resultElement.innerHTML = json.message
            resultElement.classList.add("text-success")
            resultElement.classList.remove("text-danger")

            // Mostra il toast di successo
            showToast("Messaggio inviato con successo! Ti risponderemo al più presto.", "success")

            // Resetta il form
            contactForm.reset()
          } else {
            // Errore
            console.log(response)
            resultElement.innerHTML = json.message
            resultElement.classList.add("text-danger")
            resultElement.classList.remove("text-success")

            // Mostra il toast di errore
            showToast("Si è verificato un errore nell'invio del messaggio. Riprova più tardi.", "error")
          }
        })
        .catch((error) => {
          // Errore di rete
          console.log(error)
          resultElement.innerHTML = "Si è verificato un errore durante l'invio. Riprova più tardi."
          resultElement.classList.add("text-danger")
          resultElement.classList.remove("text-success")

          // Mostra il toast di errore 
          showToast("Errore di connessione. Verifica la tua connessione internet e riprova.", "error")
        })
        .finally(() => {
          // Ripristina il pulsante e l'indicatore di caricamento
          submitBtn.disabled = false
          submitText.style.display = "inline-block"
          loadingText.style.display = "none"

          // Scorrimento automatico al risultato 
          setTimeout(() => {
            resultElement.scrollIntoView({ behavior: "smooth", block: "nearest" })
          }, 500)
        })
    })
  }

  // Gestione del logout
  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      isAuthenticated = false
      currentUser = null

      // Rimuovi lo stato di autenticazione dalla sessione
      sessionStorage.removeItem("currentUser")

      // Aggiorna l'UI
      authButtons.style.display = "flex"
      userInfo.style.display = "none"

      // Ripristina l'aspetto dei report protetti
      document.querySelectorAll(".protection-badge").forEach((badge) => {
        badge.innerHTML = '<i class="fas fa-lock"></i> Accesso riservato' // Icona del lucchetto
        badge.style.backgroundColor = "#0039a6"
      })

      // Mostra un messaggio
      showToast("Logout effettuato.", "info")
    })
  }

  // Apertura del modal di login
  if (loginButton) {
    loginButton.addEventListener("click", () => {
      loginModal.style.display = "flex"
      loginError.textContent = ""
      document.getElementById("loginEmail").value = ""
      document.getElementById("loginPassword").value = ""
    })
  }

  // Apertura del modal di registrazione
  if (registerButton) {
    registerButton.addEventListener("click", () => {
      registerModal.style.display = "flex"
      registerError.textContent = ""
      registerForm.reset()
    })
  }

  // Link tra i modal
  if (showRegisterLink) {
    showRegisterLink.addEventListener("click", (e) => { // Link per passare alla registrazione
      e.preventDefault()
      loginModal.style.display = "none"
      registerModal.style.display = "flex"
    })
  }

  if (showLoginLink) {
    showLoginLink.addEventListener("click", (e) => { // Link per passare al login
      e.preventDefault()
      registerModal.style.display = "none"
      loginModal.style.display = "flex"
    })
  }

  // Chiusura dei modal 
  closeButtons.forEach((button) => {
    button.addEventListener("click", function () {  
      const modalId = this.getAttribute("data-modal")
      document.getElementById(modalId).style.display = "none"
    })
  })

  // Chiudi i modal se si clicca fuori da essi
  window.addEventListener("click", (event) => {
    if (event.target === loginModal) { 
      loginModal.style.display = "none"
    }
    if (event.target === registerModal) {
      registerModal.style.display = "none"
    }
  })

  // Gestione dei download con verifica dell'esistenza del file e protezione
  downloadButtons.forEach((button) => {
    button.addEventListener("click", function (event) {
      event.preventDefault()

      // Ottenimento del percorso del file e lo stato di protezione
      const filePath = this.getAttribute("href")
      const isProtected = this.getAttribute("data-protected") === "true"

      // Estrazione del nome del file dal percorso
      const fileName = filePath.split("/").pop()

      // Verifica se l'utente può accedere al file
      if (isProtected && !isAuthenticated) {
        showToast("Accesso negato. Registrati o effettua il login per scaricare questo report.", "error")
        registerModal.style.display = "flex"
        return
      }

      // Verifica dell'esistenza del file prima del download
      verifyFileExists(filePath)
        .then((exists) => {
          if (exists) {
            // Se il file esiste, procede con il download
            console.log(`Download iniziato per: ${fileName}`)
            showToast(`Download di "${fileName}" iniziato...`, "success")

            // Avvia il download
            window.location.href = filePath // 
          } else {
            // Il file non esiste
            console.error(`Il file ${fileName} non esiste`)
            showToast(`Il file "${fileName}" non è disponibile al momento.`, "error")
          }
        })
        .catch((error) => {
          console.error(`Errore durante la verifica del file: ${error}`)
          showToast("Si è verificato un errore durante il download. Riprova più tardi.", "error")
        })
    })
  })

  // Modifica della funzione verifyFileExists per utilizzare i nomi file Boeing
  function verifyFileExists(url) {
    return new Promise((resolve, reject) => {

      // In un ambiente reale, questa sarebbe una richiesta al server
      // Per simulare, si controlli che il file sia nella lista di file disponibili
      const availableFiles = [
        "/reports/Boeing_Sustainability_Report_2022.pdf",
        "/reports/Boeing_Sustainability_Report_2021.pdf",
        "/reports/Boeing_Sustainability_Report_2020.pdf",
        "/reports/Boeing_Sustainability_Report_2019.pdf",
      ]

      // Aggiunta dei file protetti solo se l'utente è autenticato
      if (isAuthenticated) {
        availableFiles.push(
          "/reports/Boeing_Sustainability_Report_2024.pdf",
          "/reports/Boeing_Sustainability_Report_2023.pdf",
        )
      }

      // Simulazione di una richiesta di rete
      setTimeout(() => {
        const exists = availableFiles.includes(url) 
        resolve(exists)
      }, 500)
    })
  }

  // Funzione per mostrare notifische toast 
  function showToast(message, type = "info") {
    toast.textContent = message
    toast.className = "toast"
    toast.classList.add(type)
    toast.classList.add("show")

    setTimeout(() => {
      toast.classList.remove("show")
    }, 3000)
  }

  // Controllo dello stato di autenticazione all'avvio
  checkAuthentication()
})

