(function () {
  "use strict";

  if (!Array.prototype.forEach) {
    Array.prototype.forEach = function (cb, ctx) {
      for (let i = 0; i < this.length; i++) cb.call(ctx, this[i], i, this);
    };
  }

  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = (cb) => setTimeout(cb, 16.67);
  }

  const App = {
    isBackgroundPlaying: false,
    audioDisabled: false,
    isSceneReady: false,
    isTextureLoaded: false,

    init() {
      this.setupAudio();
      this.bindEvents();
      this.initializeAudioToggle();
      this.waitForDependencies();
      this.initYouTubePlayer();
      this.setupTabVisibility();
    },

    waitForDependencies() {
      const chk = setInterval(() => {
        if (window.gsap && window.SplitText) {
          clearInterval(chk);
          this.onDependenciesReady();
        }
      }, 100);
      setTimeout(() => {
        clearInterval(chk);
        this.onDependenciesReady();
      }, 10000);
    },

    onDependenciesReady() {},

    showError(m) {
      const el = document.getElementById("errorMessage");
      if (!el) return;
      el.textContent = m;
      el.style.display = "block";
      setTimeout(() => (el.style.display = "none"), 5000);
    },

    showFallback() {
      document.getElementById("fallbackBg").classList.add("active");
      this.finishPreloader();
    },

    setupAudio() {
      this.startClickSound = document.getElementById("startClickSound");
      this.preloaderSound = document.getElementById("preloaderSound");
      this.backgroundMusic = document.getElementById("backgroundMusic");
    },

    bindEvents() {
      document.getElementById("enableBtn").onclick = () => this.onStartClick();
      document.getElementById("noAudioBtn").onclick = () => this.onNoAudioClick();
      document.getElementById("audioToggle").onclick = () => this.toggleAudio();
      document.querySelector(".contact-toggle").onclick = () => this.toggleContact();
      document.getElementById("contactInfo").onclick = () => this.toggleContact();
      
      // Mobile menu toggle
      const mobileMenuToggle = document.getElementById("mobileMenuToggle");
      const mobileMenu = document.getElementById("mobileMenu");
      const logo = document.getElementById("logo");
      if (mobileMenuToggle && mobileMenu) {
        mobileMenuToggle.onclick = () => {
          const isActive = mobileMenu.classList.toggle("active");
          if (logo) {
            if (isActive) {
              logo.classList.add("hidden");
            } else {
              logo.classList.remove("hidden");
            }
          }
        };
      }

      // Setup nav links (both desktop and mobile)
      const setupNavLinks = (links) => {
        links.forEach((link) => {
          if (link.textContent === "MAGAZINE") {
            link.addEventListener("click", (e) => {
              e.preventDefault();
              if (mobileMenu) {
                mobileMenu.classList.remove("active");
                if (logo) logo.classList.remove("hidden");
              }
              this.toggleMagazine();
            });
          }
          if (link.textContent === "INTERNET") {
            link.addEventListener("click", (e) => {
              e.preventDefault();
              if (mobileMenu) {
                mobileMenu.classList.remove("active");
                if (logo) logo.classList.remove("hidden");
              }
              this.toggleInternet();
            });
          }
          // Ensure DESIGNS link opens in new tab
          if (link.textContent.trim() === "DESIGNS") {
            link.setAttribute("target", "_blank");
            link.setAttribute("rel", "noopener noreferrer");
            link.addEventListener("click", () => {
              if (mobileMenu) {
                mobileMenu.classList.remove("active");
                if (logo) logo.classList.remove("hidden");
              }
            });
          }
          // Ensure GIFT SHOP link opens in new tab
          if (link.textContent.trim() === "GIFT SHOP") {
            link.setAttribute("target", "_blank");
            link.setAttribute("rel", "noopener noreferrer");
            link.addEventListener("click", () => {
              if (mobileMenu) {
                mobileMenu.classList.remove("active");
                if (logo) logo.classList.remove("hidden");
              }
            });
          }
        });
      };

      setupNavLinks(document.querySelectorAll(".nav-links a"));
      setupNavLinks(document.querySelectorAll(".mobile-menu a"));
      
      this.setupNavHoverSounds();
    },

    onStartClick() {
      document.body.classList.add("loading-active");
      if (!this.audioDisabled) {
        this.startClickSound?.play().catch(() => {});
      }
      document.querySelector(".audio-enable").style.display = "none";
      document.getElementById("preloader").style.display = "flex";
      if (!this.audioDisabled) {
        if (this.preloaderSound) {
          this.preloaderSound.volume = 0.3;
          this.preloaderSound.play().catch(() => {});
        }
        setTimeout(() => {
          if (this.backgroundMusic) {
            this.backgroundMusic.volume = 0.3;
            this.backgroundMusic.play().catch(() => {});
            this.isBackgroundPlaying = true;
          }
        }, 500);
      }
      this.initializeScene();
      this.startPreloader();
    },

    onNoAudioClick() {
      this.audioDisabled = true;
      this.disableAllAudio();
      this.onStartClick();
    },

    toggleAudio() {
      this.audioDisabled = !this.audioDisabled;
      const toggle = document.getElementById("audioToggle");
      if (this.audioDisabled) {
        this.disableAllAudio();
        toggle.textContent = "AUDIO OFF";
        toggle.classList.remove("audio-on");
        toggle.classList.add("audio-off");
      } else {
        this.enableAllAudio();
        toggle.textContent = "AUDIO ON";
        toggle.classList.remove("audio-off");
        toggle.classList.add("audio-on");
      }
    },

    toggleContact() {
      const contactToggle = document.querySelector(".contact-toggle");
      const contactInfo = document.getElementById("contactInfo");
      const centralText = document.querySelector(".text-element.central-text");
      const isMobile = window.innerWidth <= 768;

      if (contactInfo.classList.contains("active")) {
        // Hide contact info and show CONTACT text
        contactInfo.classList.remove("active");
        contactToggle.style.display = "block";
        // On mobile, show avatar/name/subtitle again
        if (isMobile && centralText) {
          centralText.classList.remove("hidden");
        }
      } else {
        // Show contact info and hide CONTACT text
        contactInfo.classList.add("active");
        contactToggle.style.display = "none";
        // On mobile, hide avatar/name/subtitle
        if (isMobile && centralText) {
          centralText.classList.add("hidden");
        }
      }
    },

    toggleMagazine() {
      const logo = document.getElementById("logo");
      const centerpiece = document.querySelector(".central-text");
      const magazineContent = document.getElementById("magazineContent");
      const internetContent = document.getElementById("internetContent");
      const audioToggle = document.getElementById("audioToggle");
      const isMobile = window.innerWidth <= 768;

      if (magazineContent.classList.contains("active")) {
        // Hide magazine content, show logo and centerpiece
        magazineContent.classList.remove("active");
        if (logo) logo.style.display = "block";
        if (centerpiece) centerpiece.style.display = "flex";
        // Show audio toggle on mobile when closing
        if (isMobile && audioToggle) {
          audioToggle.style.display = "block";
        }
      } else {
        // Close internet content if open
        internetContent.classList.remove("active");
        // Show magazine content, hide logo and centerpiece
        magazineContent.classList.add("active");
        if (logo) logo.style.display = "none";
        if (centerpiece) centerpiece.style.display = "none";
        // Hide audio toggle on mobile when opening
        if (isMobile && audioToggle) {
          audioToggle.style.display = "none";
        }
      }
    },

    toggleInternet() {
      const logo = document.getElementById("logo");
      const centerpiece = document.querySelector(".central-text");
      const magazineContent = document.getElementById("magazineContent");
      const internetContent = document.getElementById("internetContent");
      const audioToggle = document.getElementById("audioToggle");
      const isMobile = window.innerWidth <= 768;

      if (internetContent.classList.contains("active")) {
        // Hide internet content, show logo and centerpiece
        internetContent.classList.remove("active");
        if (logo) logo.style.display = "block";
        if (centerpiece) centerpiece.style.display = "flex";
        // Show audio toggle on mobile when closing
        if (isMobile && audioToggle) {
          audioToggle.style.display = "block";
        }
      } else {
        // Close magazine content if open
        magazineContent.classList.remove("active");
        // Show internet content, hide logo and centerpiece
        internetContent.classList.add("active");
        if (logo) logo.style.display = "none";
        if (centerpiece) centerpiece.style.display = "none";
        // Hide audio toggle on mobile when opening
        if (isMobile && audioToggle) {
          audioToggle.style.display = "none";
        }
      }
    },

    disableAllAudio() {
      if (this.backgroundMusic) {
        this.backgroundMusic.pause();
        this.backgroundMusic.currentTime = 0;
        this.isBackgroundPlaying = false;
      }
      if (this.startClickSound) {
        this.startClickSound.pause();
        this.startClickSound.currentTime = 0;
      }
      if (this.preloaderSound) {
        this.preloaderSound.pause();
        this.preloaderSound.currentTime = 0;
      }
    },

    enableAllAudio() {
      if (this.backgroundMusic) {
        this.backgroundMusic.volume = 0.3;
        this.backgroundMusic.play().catch(() => {});
        this.isBackgroundPlaying = true;
      }
    },

    initializeAudioToggle() {
      const toggle = document.getElementById("audioToggle");
      if (toggle) {
        if (this.audioDisabled) {
          toggle.textContent = "AUDIO OFF";
          toggle.classList.remove("audio-on");
          toggle.classList.add("audio-off");
        } else {
          toggle.textContent = "AUDIO ON";
          toggle.classList.remove("audio-off");
          toggle.classList.add("audio-on");
        }
      }
    },

    startPreloader() {
      let c = 0;
      const timer = setInterval(() => {
        const el = document.getElementById("counter");
        if (el)
          el.textContent =
            "[" + ++c + "]";
        if (c >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            this.preloaderSound?.pause();
            if (this.preloaderSound) this.preloaderSound.currentTime = 0;
            this.finishPreloader();
          }, 200);
        }
      }, 30);
    },

    finishPreloader() {
      const wait = () => {
        if (this.isSceneReady && this.isTextureLoaded) {
          const pre = document.getElementById("preloader");
          pre.classList.add("fade-out");
          setTimeout(() => {
            document.body.classList.remove("loading-active");
            pre.style.display = "none";
            pre.classList.remove("fade-out");
            this.animateTextElements();
          }, 800);
        } else setTimeout(wait, 50);
      };
      wait();
    },

    animateTextElements() {
      if (!window.gsap || !window.SplitText) {
        this.fallbackTextAnimation();
        return;
      }

      const ease = window.CustomEase
        ? (CustomEase.create("customOut", "0.65,0.05,0.36,1"), "customOut")
        : "power2.out";
      const containers = [
        ".description",
        ".division",
        ".signal",
        ".footer"
      ];

      gsap.set(containers.concat(".nav-links", ".logo", ".central-text"), { opacity: 0 });
      gsap.set(".logo", { opacity: 0, y: 30 });
      gsap.set(".central-text", { opacity: 0, y: 30 });

      const splits = containers.map(
        (sel) =>
          SplitText.create(sel, { type: "lines", linesClass: "line" }).lines
      );
      const [descLines, divLines, sigLines, footerLines] = splits;

      gsap.set(containers, { opacity: 1 });
      gsap.set(".central-text", { opacity: 1 });
      gsap.set(splits.flat().concat(".nav-links a"), { opacity: 0, y: 30 });

      const tl = gsap.timeline();
      tl.to(".logo", { opacity: 1, y: 0, duration: 1, ease }, 0)
        .to(descLines, { opacity: 1, y: 0, duration: 0.8, ease, stagger: 0.18 }, 0.3)
        .to(".nav-links", { opacity: 1, duration: 0.2 }, 0.12)
        .to(
          ".nav-links a",
          { opacity: 1, y: 0, duration: 0.8, ease, stagger: 0.15 },
          0.12
        )
        .to(
          ".central-text",
          { opacity: 1, y: 0, duration: 0.8, ease },
          0.25
        )
        .to(
          "#audioToggle",
          { opacity: 0.6, duration: 0.8, ease, onStart: () => {
            this.initializeAudioToggle();
          }, onComplete: () => {
            const toggle = document.getElementById("audioToggle");
            if (toggle) toggle.style.pointerEvents = "auto";
          }},
          0.3
        )
        .to(
          footerLines,
          { opacity: 1, y: 0, duration: 0.8, ease, stagger: 0.18 },
          0.4
        )
        .to(
          divLines,
          { opacity: 1, y: 0, duration: 0.8, ease, stagger: 0.18 },
          0.55
        )
        .to(
          sigLines,
          { opacity: 1, y: 0, duration: 0.8, ease, stagger: 0.18 },
          0.55
        );
    },

    fallbackTextAnimation() {
      // Animate logo first
      const logo = document.querySelector(".logo");
      if (logo) {
        setTimeout(() => {
          logo.style.opacity = "1";
          logo.style.transform = "translate(-50%, 0) translateY(0)";
        }, 0);
      }
      
      let d = 300;
      document.querySelectorAll(".text-element:not(.logo)").forEach((el) => {
        setTimeout(() => {
          el.style.opacity = "1";
          el.style.transform = el.classList.contains("central-text")
            ? "translateX(-50%) translateY(0)"
            : "translateY(0)";
        }, d);
        d += 250;
      });
      // Show audio toggle
      setTimeout(() => {
        this.initializeAudioToggle();
        const toggle = document.getElementById("audioToggle");
        if (toggle) {
          toggle.style.opacity = "0.6";
          toggle.style.pointerEvents = "auto";
        }
      }, d);
    },

    initializeScene() {
      this.isSceneReady = true;
      this.isTextureLoaded = true;
      
      // Hide the canvas
      const canvas = document.getElementById("canvas");
      if (canvas) {
        canvas.style.display = "none";
      }
    },

    setupNavHoverSounds() {
      // No hover sounds - function left empty to prevent any audio from playing on menu hover
    },

    initYouTubePlayer() {
      // Wait for YouTube IFrame API to be ready
      if (window.YT && window.YT.Player) {
        const container = document.getElementById("youtube-background");
        if (!container) return;

        // Create YouTube player instance (API will create iframe inside container)
        this.youtubePlayer = new YT.Player("youtube-background", {
          videoId: "z977gKXg1_k",
          playerVars: {
            autoplay: 1,
            loop: 1,
            playlist: "z977gKXg1_k", // Required for looping
            controls: 0,
            showinfo: 0,
            rel: 0,
            mute: 1,
            modestbranding: 1,
            playsinline: 1
          },
          events: {
            onReady: (event) => {
              // Set playback quality to highest available
              const qualityLevels = ["highres", "hd1080", "hd720", "large", "medium", "small"];
              for (const quality of qualityLevels) {
                try {
                  event.target.setPlaybackQuality(quality);
                  // Check if quality was actually set
                  const currentQuality = event.target.getPlaybackQuality();
                  if (currentQuality && currentQuality !== "unknown") {
                    break; // Quality was set successfully
                  }
                } catch (e) {
                  // Continue to next quality level
                }
              }
            },
            onStateChange: (event) => {
              // Ensure quality is maintained when video restarts/loops
              if (event.data === YT.PlayerState.PLAYING) {
                const qualityLevels = ["highres", "hd1080", "hd720", "large"];
                for (const quality of qualityLevels) {
                  try {
                    event.target.setPlaybackQuality(quality);
                    break;
                  } catch (e) {
                    // Continue to next quality level
                  }
                }
              }
            },
            onError: (event) => {
              // If video fails to load, show fallback background
              // Error codes: 2=invalid parameter, 5=HTML5 error, 100=video not found, 101/150=embedding not allowed
              if (event.data >= 100) {
                this.showFallback();
              }
            }
          }
        });
      } else {
        // Retry if API not loaded yet
        setTimeout(() => this.initYouTubePlayer(), 100);
      }
    },

    setupTabVisibility() {
      // Handle tab visibility changes to resume video when tab becomes active
      document.addEventListener("visibilitychange", () => {
        if (!document.hidden && this.youtubePlayer && window.YT) {
          // Tab became visible - resume video playback
          try {
            const playerState = this.youtubePlayer.getPlayerState();
            // PlayerState constants: -1=UNSTARTED, 0=ENDED, 1=PLAYING, 2=PAUSED, 3=BUFFERING, 5=CUED
            // If video is paused, ended, or cued, play it
            if (playerState === window.YT.PlayerState.PAUSED || 
                playerState === window.YT.PlayerState.ENDED || 
                playerState === window.YT.PlayerState.CUED ||
                playerState === -1) { // UNSTARTED
              this.youtubePlayer.playVideo();
            }
          } catch (e) {
            // If there's an error, try to reload the video
            try {
              this.youtubePlayer.playVideo();
            } catch (err) {
              // Video might not be ready yet, ignore
            }
          }
        }
      });

      // Also handle window focus/blur events as fallback
      window.addEventListener("focus", () => {
        if (this.youtubePlayer && window.YT) {
          try {
            const playerState = this.youtubePlayer.getPlayerState();
            if (playerState === window.YT.PlayerState.PAUSED || 
                playerState === window.YT.PlayerState.ENDED || 
                playerState === window.YT.PlayerState.CUED ||
                playerState === -1) { // UNSTARTED
              this.youtubePlayer.playVideo();
            }
          } catch (e) {
            // Ignore errors
          }
        }
      });
    }
  };

  // YouTube IFrame API callback
  window.onYouTubeIframeAPIReady = () => {
    if (window.App) {
      window.App.initYouTubePlayer();
    }
  };

  window.addEventListener("error", (e) => {
    let m = "An error occurred";
    if (e.error?.message) m += ": " + e.error.message;
    if (e.filename) m += " in " + e.filename;
    App.showError(m + ". Some features may not work properly.");
  });

  window.addEventListener("unhandledrejection", (e) => {
    App.showError(
      "Loading failed: " + (e.reason || "Unknown error") + ". Retrying..."
    );
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => App.init());
  } else {
    App.init();
  }

  window.App = App;
})();
