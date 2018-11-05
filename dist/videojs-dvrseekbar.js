/*! @name videojs-dvrseekbar @version 0.2.6 @license Apache-2.0 */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('video.js')) :
  typeof define === 'function' && define.amd ? define(['video.js'], factory) :
  (global.videojsDvrseekbar = factory(global.videojs));
}(this, (function (videojs) { 'use strict';

  videojs = videojs && videojs.hasOwnProperty('default') ? videojs['default'] : videojs;

  // Default options for the plugin.
  var defaults = {
    startTime: 0
  };

  /**
   * Function to invoke when the player is ready.
   *
   * This is a great place for your plugin to initialize itself. When this
   * function is called, the player will have its DOM and child components
   * in place.
   *
   * @function onPlayerReady
   * @param    {Player} player
   * @param    {Object} [options={}]
   */
  var onPlayerReady = function onPlayerReady(player, options) {
    player.addClass('vjs-dvrseekbar');
    player.controlBar.addClass('vjs-dvrseekbar-control-bar');

    if (player.controlBar.progressControl) {
      player.controlBar.progressControl.addClass('vjs-dvrseekbar-progress-control');
    }

    // ADD Live Button:
    var btnLiveEl = document.createElement('div'),
        newLink = document.createElement('button');

    btnLiveEl.className = 'vjs-live-button vjs-control';

    newLink.innerHTML = document.getElementsByClassName('vjs-live-display')[0].innerHTML;
    newLink.id = 'liveButton';

    if (!player.paused()) {
      newLink.className = 'vjs-live-label onair';
    }

    var clickHandler = function clickHandler(e) {
      player.currentTime(player.seekable().end(0));

      player.play();
    };

    if (newLink.addEventListener) {
      // DOM method
      newLink.addEventListener('click', clickHandler, false);
    } else if (newLink.attachEvent) {
      // this is for IE, because it doesn't support addEventListener
      newLink.attachEvent('onclick', function () {
        return clickHandler.apply(newLink, [window.event]);
      });
    }

    btnLiveEl.appendChild(newLink);

    var controlBar = document.getElementsByClassName('vjs-control-bar')[0],
        insertBeforeNode = document.getElementsByClassName('vjs-progress-control')[0];

    controlBar.insertBefore(btnLiveEl, insertBeforeNode);

    videojs.log('dvrSeekbar Plugin ENABLED!', options);
  };

  var onTimeUpdate = function onTimeUpdate(player, e) {
    var time = player.seekable();
    var btnLiveEl = document.getElementById('liveButton');

    // When any tech is disposed videojs will trigger a 'timeupdate' event when calling stopTrackingCurrentTime()
    // If the tech does not have a seekable() method, time will be undefined
    if (!time || !time.length) {
      return;
    }

    /*let time1 = time && time.length ? time.end(0) - time.start(0) : 0;
     if(time1 > 0) {
      player.duration(time1 + 2);
    }
    */

    if (time.end(0) - player.currentTime() < 30) {

      btnLiveEl.className = 'vjs-live-label onair';
    } else {
      btnLiveEl.className = 'vjs-live-label';
    }

    player.duration(player.seekable().end(0));
  };

  /**
   * A video.js plugin.
   *
   * In the plugin function, the value of `this` is a video.js `Player`
   * instance. You cannot rely on the player being in a "ready" state here,
   * depending on how the plugin is invoked. This may or may not be important
   * to you; if not, remove the wait for "ready"!
   *
   * @function dvrseekbar
   * @param    {Object} [options={}]
   *           An object of options left to the plugin author to define.
   */
  var dvrseekbar = function dvrseekbar(options) {
    var _this = this;
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

    if (!options) {
      options = defaults;
    }

    this.on('timeupdate', function (e) {
      onTimeUpdate(_this, e);
    });

    this.on('play', function (e) {});

    this.on('pause', function (e) {
      var btnLiveEl = document.getElementById('liveButton');

      btnLiveEl.className = 'vjs-live-label';
    });

    this.ready(function () {
      onPlayerReady(_this, videojs.mergeOptions(defaults, options));
    });
  };

  // Register the plugin with video.js.
  videojs.plugin('dvrseekbar', dvrseekbar);

  // Include the version number.
  dvrseekbar.VERSION = '__VERSION__';

  return dvrseekbar;

})));
