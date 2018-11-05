/*! @name videojs-dvrseekbar @version 1.0.0 @license Apache-2.0 */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('video.js')) :
  typeof define === 'function' && define.amd ? define(['video.js'], factory) :
  (global.videojsDvrseekbar = factory(global.videojs));
}(this, (function (videojs) { 'use strict';

  videojs = videojs && videojs.hasOwnProperty('default') ? videojs['default'] : videojs;

  var version = "1.0.0";

  function getSeekRange(player) {
    var shakaPlayer = player && player.tech_ && player.tech_.shakaPlayer;
    if (shakaPlayer && shakaPlayer.seekRange) {
      return shakaPlayer.seekRange();
    } else if (player.seekable && player.seekable().length > 0) {
      return {
        start: player.seekable().start(0),
        end: player.seekable().end(0)
      };
    }
    return {
      start: 0,
      end: player.duration()
    };
  }

  function getDuration(player) {
    if (player.duration() === Infinity) {
      var seekRange = getSeekRange(player);
      return seekRange.end - seekRange.start;
    }
    return player.duration();
  }

  function behindLiveTime(player) {
    var seekRange = getSeekRange(player);
    // TODO: add when seekbar is Seeking
    var currentTime = player.currentTime();
    var behindLive = Math.floor(seekRange.end - currentTime);
    return Math.max(0, behindLive);
  }

  /**
    * Builds a time string, e.g., 01:04:23, from |displayTime|.
    *
    * @param {number} displayTime
    * @param {boolean} showHour
    * @return {string}
    * @private
    */
  function buildTimeString(displayTime) {
    var showHour = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

    var h = Math.floor(displayTime / 3600);
    var m = Math.floor(displayTime / 60 % 60);
    var s = Math.floor(displayTime % 60);

    if (s < 10) {
      s = '0' + s;
    }

    var text = m + ':' + s;

    if (showHour) {
      if (m < 10) {
        text = '0' + text;
      }
      text = h + ':' + text;
    }
    return text;
  }

  var classCallCheck = function (instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  };

  var inherits = function (subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
  };

  var possibleConstructorReturn = function (self, call) {
    if (!self) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return call && (typeof call === "object" || typeof call === "function") ? call : self;
  };

  var Component = videojs.getComponent('Component');
  var SHOW_LIVE_MAX = 15;

  var LiveButton = function (_Component) {
    inherits(LiveButton, _Component);

    function LiveButton(player, options) {
      classCallCheck(this, LiveButton);

      var _this = possibleConstructorReturn(this, _Component.call(this, player, options));

      _this.on('click', _this.clicked);
      _this.setInterval(_this.update, 125);
      return _this;
    }

    LiveButton.prototype.createEl = function createEl() {
      return videojs.dom.createEl('div', {
        id: 'dvr-current-time',
        // Starts hidden
        className: 'vjs-current-time-display vjs-hidden',
        innerHTML: '0:00'
      });
    };

    LiveButton.prototype.clicked = function clicked() {
      // Jump to live
      this.player_.currentTime(getSeekRange(this.player_).end);
    };

    LiveButton.prototype.update = function update() {
      var seekRange = getSeekRange(this.player_);
      var showHour = seekRange.end - seekRange.start >= 3600;
      var displayTime = behindLiveTime(this.player_);

      // Consider "LIVE" when less than 15 second behind the live-edge.  Always
      // show the full time string when seeking, including the leading '-';
      // otherwise, the time string "flickers" near the live-edge.
      if (displayTime !== Infinity && displayTime >= SHOW_LIVE_MAX) {
        this.el().innerHTML = '- ' + buildTimeString(displayTime, showHour);
      } else {
        this.el().innerHTML = this.localize('LIVE');
      }
    };

    return LiveButton;
  }(Component);

  videojs.registerComponent('LiveButton', LiveButton);

  var MouseTimeDisplay = videojs.getComponent('MouseTimeDisplay');
  var MIN_LIVE_DELAY = 15;

  var DvrMouseTimeDisplay = function (_MouseTimeDisplay) {
    inherits(DvrMouseTimeDisplay, _MouseTimeDisplay);

    function DvrMouseTimeDisplay() {
      classCallCheck(this, DvrMouseTimeDisplay);
      return possibleConstructorReturn(this, _MouseTimeDisplay.apply(this, arguments));
    }

    DvrMouseTimeDisplay.prototype.update = function update(seekBarRect, seekBarPoint) {
      var _this2 = this;

      // If there is an existing rAF ID, cancel it so we don't over-queue.
      if (this.rafId_) {
        this.cancelAnimationFrame(this.rafId_);
      }

      this.rafId_ = this.requestAnimationFrame(function () {
        var duration = getDuration(_this2.player_);
        var seekTime = _this2.player_.duration() === Infinity ? seekBarPoint * duration - duration : seekBarPoint * duration;
        var content = videojs.formatTime(Math.abs(seekTime));

        if (_this2.player_.duration() === Infinity && Math.abs(seekTime) <= MIN_LIVE_DELAY) {
          content = _this2.localize('LIVE');
        } else if (seekTime < 0) {
          content = '-' + content;
        }

        _this2.el_.style.left = seekBarRect.width * seekBarPoint + 'px';
        _this2.getChild('timeTooltip').update(seekBarRect, seekBarPoint, content);
      });
    };

    return DvrMouseTimeDisplay;
  }(MouseTimeDisplay);

  videojs.registerComponent('DvrMouseTimeDisplay', DvrMouseTimeDisplay);

  var SeekBar = videojs.getComponent('SeekBar');

  var DvrSeekBar = function (_SeekBar) {
    inherits(DvrSeekBar, _SeekBar);

    function DvrSeekBar() {
      classCallCheck(this, DvrSeekBar);
      return possibleConstructorReturn(this, _SeekBar.apply(this, arguments));
    }

    DvrSeekBar.prototype.update_ = function update_(currentTime, percent) {
      var duration = getDuration(this.player_);

      // machine readable value of progress bar (percentage complete)
      this.el_.setAttribute('aria-valuenow', (percent * 100).toFixed(2));

      // human readable value of progress bar (time complete)
      this.el_.setAttribute('aria-valuetext', this.localize('progress bar timing: currentTime={1} duration={2}', [videojs.formatTime(currentTime, duration), videojs.formatTime(duration, duration)], '{1} of {2}'));

      // Update the `PlayProgressBar`.
      this.bar.update(videojs.dom.getBoundingClientRect(this.el_), percent);
    };

    DvrSeekBar.prototype.handleMouseMove = function handleMouseMove(event) {
      if (!videojs.dom.isSingleLeftClick(event)) {
        return;
      }

      var startTime = getSeekRange(this.player_).start;
      var duration = getDuration(this.player_);
      var newTime = this.calculateDistance(event) * duration + startTime;

      // Don't let video end while scrubbing.
      if (newTime === duration) {
        newTime = newTime - 0.1;
      }

      // Set new time (tell player to seek to new time)
      this.player_.currentTime(newTime);
    };

    DvrSeekBar.prototype.getPercent = function getPercent() {
      var duration = getDuration(this.player_);
      var startTime = getSeekRange(this.player_).start;
      var currentTime = this.getCurrentTime_() - startTime;
      var percent = currentTime / duration;
      return percent >= 1 ? 1 : percent || 0;
    };

    return DvrSeekBar;
  }(SeekBar);

  DvrSeekBar.prototype.options_ = {
    children: ['loadProgressBar', 'playProgressBar'],
    barName: 'playProgressBar'
  };

  // MouseTimeDisplay tooltips should not be added to a player on mobile devices
  if (!videojs.browser.IS_IOS && !videojs.browser.IS_ANDROID) {
    DvrSeekBar.prototype.options_.children.splice(1, 0, 'DvrMouseTimeDisplay');
  }

  videojs.registerComponent('DvrSeekBar', DvrSeekBar);

  var ProgressControl = videojs.getComponent('ProgressControl');

  var DvrProgressControl = function (_ProgressControl) {
    inherits(DvrProgressControl, _ProgressControl);

    function DvrProgressControl() {
      classCallCheck(this, DvrProgressControl);
      return possibleConstructorReturn(this, _ProgressControl.apply(this, arguments));
    }

    DvrProgressControl.prototype.handleMouseMove = function handleMouseMove(event) {
      var seekBar = this.getChild('DvrSeekBar');

      if (seekBar) {
        var mouseTimeDisplay = seekBar.getChild('DvrMouseTimeDisplay');
        var seekBarEl = seekBar.el();
        var seekBarRect = videojs.dom.getBoundingClientRect(seekBarEl);
        var seekBarPoint = videojs.dom.getPointerPosition(seekBarEl, event).x;

        // The default skin has a gap on either side of the `SeekBar`. This means
        // that it's possible to trigger this behavior outside the boundaries of
        // the `SeekBar`. This ensures we stay within it at all times.
        if (seekBarPoint > 1) {
          seekBarPoint = 1;
        } else if (seekBarPoint < 0) {
          seekBarPoint = 0;
        }

        if (mouseTimeDisplay) {
          mouseTimeDisplay.update(seekBarRect, seekBarPoint);
        }
      }
    };

    DvrProgressControl.prototype.handleMouseSeek = function handleMouseSeek(event) {
      var seekBar = this.getChild('DvrSeekBar');

      if (seekBar) {
        seekBar.handleMouseMove(event);
      }
    };

    DvrProgressControl.prototype.handleMouseDown = function handleMouseDown(event) {
      var doc = this.el_.ownerDocument;
      var seekBar = this.getChild('DvrSeekBar');

      if (seekBar) {
        seekBar.handleMouseDown(event);
      }

      this.on(doc, 'mousemove', this.throttledHandleMouseSeek);
      this.on(doc, 'touchmove', this.throttledHandleMouseSeek);
      this.on(doc, 'mouseup', this.handleMouseUp);
      this.on(doc, 'touchend', this.handleMouseUp);
    };

    DvrProgressControl.prototype.handleMouseUp = function handleMouseUp(event) {
      var doc = this.el_.ownerDocument;
      var seekBar = this.getChild('DvrSeekBar');

      if (seekBar) {
        seekBar.handleMouseUp(event);
      }

      this.off(doc, 'mousemove', this.throttledHandleMouseSeek);
      this.off(doc, 'touchmove', this.throttledHandleMouseSeek);
      this.off(doc, 'mouseup', this.handleMouseUp);
      this.off(doc, 'touchend', this.handleMouseUp);
    };

    return DvrProgressControl;
  }(ProgressControl);

  DvrProgressControl.prototype.options_ = {
    children: ['DvrSeekBar']
  };

  videojs.registerComponent('DvrProgressControl', DvrProgressControl);

  var Plugin = videojs.getPlugin('plugin');

  // Default options for the plugin.
  var defaults$1 = {
    startTime: 'LIVE',
    // Minimun time in dvr to show the seekbar
    dvrMinTime: 840
  };

  var SeekBar$1 = videojs.getComponent('SeekBar');

  SeekBar$1.prototype.dvrTotalTime = function (player) {
    var time = player.seekable();

    return time && time.length ? time.end(0) - time.start(0) : 0;
  };

  SeekBar$1.prototype.handleMouseMove = function (e) {
    var bufferedTime = void 0;
    var newTime = void 0;

    bufferedTime = newTime = this.player_.seekable();

    if (bufferedTime && bufferedTime.length) {
      var progress = this.calculateDistance(e) * this.dvrTotalTime(this.player_);

      newTime = bufferedTime.start(0) + progress;
      for (; newTime >= bufferedTime.end(0);) {
        newTime -= 0.1;
      }

      this.player_.currentTime(newTime);
    }
  };

  SeekBar$1.prototype.updateAriaAttributes = function () {
    var seekableRanges = this.player_.seekable() || [];

    if (seekableRanges.length) {
      var lastSeekableTime = seekableRanges.end(0);
      var cachedCTime = this.player_.getCache().currentTime;
      var currentTime = this.player_.scrubbing ? cachedCTime : this.player_.currentTime();
      var timeToLastSeekable = void 0;

      // Get difference between last seekable moment and current time
      timeToLastSeekable = lastSeekableTime - currentTime;
      if (timeToLastSeekable < 0) {
        timeToLastSeekable = 0;
      }

      // Update current time control
      var formattedTime = videojs.formatTime(timeToLastSeekable, lastSeekableTime);
      var formattedPercentage = Math.round(100 * this.getPercent(), 2);

      this.el_.setAttribute('aria-valuenow', formattedPercentage);
      this.el_.setAttribute('aria-valuetext', (currentTime ? '' : '-') + formattedTime);
    }
  };

  /**
   * An advanced Video.js plugin. For more information on the API
   *
   * See: https://blog.videojs.com/feature-spotlight-advanced-plugins/
   */

  var Dvrseekbar = function (_Plugin) {
    inherits(Dvrseekbar, _Plugin);

    /**
     * Create a Dvrseekbar plugin instance.
     *
     * @param  {Player} player
     *         A Video.js Player instance.
     *
     * @param  {Object} [options]
     *         An optional options object.
     *
     *         While not a core part of the Video.js plugin architecture, a
     *         second argument of options is a convenient way to accept inputs
     *         from your plugin's caller.
     */
    function Dvrseekbar(player, options) {
      classCallCheck(this, Dvrseekbar);

      var _this = possibleConstructorReturn(this, _Plugin.call(this, player));
      // the parent class will add player under this.player


      _this.options = videojs.mergeOptions(defaults$1, options);

      _this.tech = null;

      // Shaka Player instance
      // More on https://shaka-player-demo.appspot.com/docs/api/shaka.Player.html
      _this.shakaPlayer = null;

      _this.seekbar = null;
      _this.liveButton = null;

      _this.player.ready(function () {
        _this.player.addClass('vjs-dvrseekbar');
      });

      // Tries to load the tech in "loadedmetadata" event
      _this.player.on('loadedmetadata', _this.techLoaded.bind(_this));
      _this.player.on('loadeddata', _this.init.bind(_this));
      return _this;
    }

    Dvrseekbar.prototype.techLoaded = function techLoaded() {
      this.tech = this.player.tech_;
      // Assumes shakaPlayer is in player.tech TODO: make it configurable
      this.shakaPlayer = this.tech && this.tech.shakaPlayer;
    };

    /**
     * Creates dvr seekbar
     *
     * @memberof Dvrseekbar
     */


    Dvrseekbar.prototype.init = function init() {
      var controlBar = this.player.controlBar;
      var dvrSeekBar = controlBar && controlBar.dvrProgressControl && controlBar.dvrProgressControl.DvrSeekBar;
      var playProgressBar = dvrSeekBar && dvrSeekBar.playProgressBar;

      if (this.player.duration() === Infinity) {
        controlBar.liveButton.show();

        if (this.isDVR()) {
          controlBar.dvrProgressControl.show();
          playProgressBar.removeChild('TimeTooltip');
          this.player.currentTime(this.getCurrentLiveTime(this.options.startTime));
        } else {
          controlBar.dvrProgressControl.hide();
        }
      } else {
        controlBar.liveButton.hide();
        controlBar.dvrProgressControl.show();

        if (!playProgressBar.getChild('TimeTooltip')) {
          playProgressBar.addChild('TimeTooltip');
        }
      }
    };

    Dvrseekbar.prototype.isDVR = function isDVR() {
      if (this.shakaPlayer) {
        return this.shakaPlayer.seekRange().end - this.shakaPlayer.seekRange().start > this.options.dvrMinTime;
      } else if (this.player.seekable().length > 0) {
        return this.player.seekable().end(0) - this.player.seekable().start(0) > this.options.dvrMinTime;
      }
      return false;
    };

    Dvrseekbar.prototype.getCurrentLiveTime = function getCurrentLiveTime(startTime) {
      var seekRange = getSeekRange(this.player);

      if (startTime === 'LIVE') {
        return seekRange.end;
      }
      return seekRange.start;
    };

    return Dvrseekbar;
  }(Plugin);

  // Define default values for the plugin's `state` object here.


  Dvrseekbar.defaultState = {};

  // Include the version number.
  Dvrseekbar.VERSION = version;

  // Register the plugin with video.js.
  videojs.registerPlugin('dvrseekbar', Dvrseekbar);

  return Dvrseekbar;

})));
