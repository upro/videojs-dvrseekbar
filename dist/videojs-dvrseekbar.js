/*! @name videojs-dvrseekbar @version 0.2.6 @license Apache-2.0 */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('video.js')) :
  typeof define === 'function' && define.amd ? define(['video.js'], factory) :
  (global.videojsDvrseekbar = factory(global.videojs));
}(this, (function (videojs) { 'use strict';

  videojs = videojs && videojs.hasOwnProperty('default') ? videojs['default'] : videojs;

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

  var Plugin = videojs.getPlugin('plugin');

  // Default options for the plugin.
  var defaults$1 = {
    startTime: 0
  };

  var Dvrseekbar = function (_Plugin) {
    inherits(Dvrseekbar, _Plugin);

    function Dvrseekbar(player, options) {
      classCallCheck(this, Dvrseekbar);

      var _this = possibleConstructorReturn(this, _Plugin.call(this, player));

      _this.btnLiveEl = null;
      _this.oldSeekBar = null;

      _this.options = videojs.mergeOptions(defaults$1, options);

      _this.player.ready(function () {
        _this.player.addClass('vjs-dvrseekbar');
        _this.player.controlBar.addClass('vjs-dvrseekbar-control-bar');

        if (_this.player.controlBar.progressControl) {
          _this.player.controlBar.progressControl.addClass('vjs-dvrseekbar-progress-control');
        }

        // ADD Live Button:
        var btnLiveEl = document.createElement('div');
        _this.newLink = document.createElement('button');

        btnLiveEl.className = 'vjs-live-button vjs-control';

        _this.newLink.innerHTML = document.getElementsByClassName('vjs-live-display')[0].innerHTML;
        _this.newLink.id = 'liveButton';

        if (!player.paused()) {
          _this.newLink.className = 'vjs-live-label onair';
        }

        var clickHandler = function clickHandler(e) {
          player.currentTime(player.seekable().end(0));

          player.play();
        };

        if (_this.newLink.addEventListener) {
          // DOM method
          _this.newLink.addEventListener('click', clickHandler, false);
        } else if (_this.newLink.attachEvent) {
          // this is for IE, because it doesn't support addEventListener
          _this.newLink.attachEvent('onclick', function () {
            return clickHandler.apply(newLink, [window.event]);
          });
        }

        btnLiveEl.appendChild(_this.newLink);

        var controlBar = document.getElementsByClassName('vjs-control-bar')[0],
            insertBeforeNode = document.getElementsByClassName('vjs-progress-control')[0];

        controlBar.insertBefore(btnLiveEl, insertBeforeNode);

        videojs.log('dvrSeekbar Plugin ENABLED!');
      });

      _this.setSeekBar();
      _this.init();
      return _this;
    }

    Dvrseekbar.prototype.init = function init() {
      var _this2 = this;

      this.player.on('timeupdate', function (e) {
        _this2.onTimeUpdate(_this2, e);
      });

      this.player.on('play', function (e) {});

      this.player.on('pause', function (e) {
        var btnLiveEl = document.getElementById('liveButton');

        btnLiveEl.className = 'vjs-live-label';
      });
    };

    Dvrseekbar.prototype.setSeekBar = function setSeekBar() {
      this.oldSeekBar = videojs.getComponent('SeekBar');
      var SeekBar = videojs.getComponent('SeekBar');

      SeekBar.prototype.dvrTotalTime = function (player) {
        var time = player.seekable();

        return time && time.length ? time.end(0) - time.start(0) : 0;
      };

      SeekBar.prototype.handleMouseMove = function (e) {
        var bufferedTime = void 0,
            newTime = void 0;

        bufferedTime = newTime = this.player_.seekable();

        if (bufferedTime && bufferedTime.length) {
          for (newTime = bufferedTime.start(0) + this.calculateDistance(e) * this.dvrTotalTime(this.player_); newTime >= bufferedTime.end(0);) {
            newTime -= .1;
          }this.player_.currentTime(newTime);
        }
      };

      SeekBar.prototype.updateAriaAttributes = function () {
        var a = void 0,
            c = void 0,
            d = this.player_.seekable();

        d && d.length && (a = this.player_.scrubbing ? this.player_.getCache().currentTime : this.player_.currentTime(), c = d.end(0) - a, c = 0 > c ? 0 : c, this.el_.setAttribute('aria-valuenow', Math.round(100 * this.getPercent(), 2)), this.el_.setAttribute('aria-valuetext', (0 === a ? "" : "-") + videojs.formatTime(c, d.end(0))));
      };
    };

    Dvrseekbar.prototype.onTimeUpdate = function onTimeUpdate() {
      var time = this.player.seekable();
      var btnLiveEl = document.getElementById('liveButton');

      // When any tech is disposed videojs will trigger a 'timeupdate' event when calling stopTrackingCurrentTime()
      // If the tech does not have a seekable() method, time will be undefined
      if (!time || !time.length) {
        return;
      }

      if (time.end(0) - this.player.currentTime() < 30) {
        btnLiveEl.className = 'vjs-live-label onair';
      } else {
        btnLiveEl.className = 'vjs-live-label';
      }

      this.player.duration(this.player.seekable().end(0));
    };

    Dvrseekbar.prototype.dispose = function dispose() {
      this.player.removeClass('vjs-dvrseekbar');
      this.player.controlBar.removeClass('vjs-dvrseekbar-control-bar');
      if (this.player.controlBar.progressControl) {
        this.player.controlBar.progressControl.removeClass('vjs-dvrseekbar-progress-control');
      }

      Array.from(document.getElementsByClassName('vjs-live-button')).forEach(function (element) {
        return element.remove();
      });

      if (this.newLink.addEventListener) {
        // DOM method
        this.newLink.removeEventListener('click', function () {});
      } else if (this.newLink.attachEvent) {
        // this is for IE, because it doesn't support addEventListener
        this.newLink.detachEvent('onclick');
      }
      this.player.off('timeupdate');
      this.player.off('play');
      this.player.off('pause');
      _Plugin.prototype.dispose.call(this);
      videojs.log('the advanced plugin is being disposed');
    };

    return Dvrseekbar;
  }(Plugin);
  // Register the plugin with video.js.


  videojs.registerPlugin('dvrseekbar', Dvrseekbar);

  // Include the version number.
  Dvrseekbar.VERSION = '__VERSION__';

  return Dvrseekbar;

})));
