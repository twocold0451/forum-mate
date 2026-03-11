// ==UserScript==
// @name         ForumMate 论坛增强助手
// @namespace    http://tampermonkey.net/
// @version      1.10.1
// @description  ForumMate 论坛增强助手：当前支持 2libra.com、middlefun.com、v2ex.com、linux.do 的帖子快速查看与筛选
// @author       twocold0451
// @homepage     https://github.com/twocold0451/forum-mate
// @supportURL   https://github.com/twocold0451/forum-mate/issues
// @match        https://*.2libra.com/*
// @match        https://*.middlefun.com/*
// @match        https://*.v2ex.com/*
// @match        https://linux.do/*
// @match        https://*.linux.do/*
// @license MIT
// @grant        GM_registerMenuCommand
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

(function() {
    'use strict';

    // Initialization log
    console.log('ForumMate Script: Loaded and running...');

    // Shared config
    const CONFIG = {
        btnText: '快速查看',
        modalId: 'forummate-quick-view-modal',
        iframeId: 'forummate-quick-view-iframe',
        settingsModalId: 'forummate-settings-modal',
        settingsButtonId: 'forummate-settings-button',
        feedbackUrl: 'https://github.com/twocold0451/forum-mate/discussions/1',
        appreciationUrl: 'https://github.com/twocold0451/forum-mate#赞赏支持'
    };

    // Settings state
    let Settings;
    const SITE_CONFIGS = Object.freeze({
        '2libra': Object.freeze({
            key: '2libra',
            displayName: '2libra',
            domains: Object.freeze(['2libra.com']),
            family: '2libra-like',
            settings: Object.freeze({
                titleQuickView: 'clickTitleQuickView',
                backToTop: 'showBackToTopButton',
                modalWidth: 'quickViewModalWidth'
            }),
            features: Object.freeze({
                skipInitInEmbeddedFrame: true,
                lazyListItemProcessing: true,
                listQuickButtonEnabled: true,
                previewHidePromotions: true,
                previewUse2LibraLikeScrollMode: true,
                notificationsQuickView: true,
                v2exTopicFilter: false,
                backToTopUseTallestCardFallback: true
            }),
            selectors: Object.freeze({
                backToTopAnchors: Object.freeze(['[data-main-left="true"]', 'main .flex-1', '.flex-1'])
            }),
            urlRules: Object.freeze({}),
            defaults: Object.freeze({
                backToTopEnabled: true
            }),
            styles: Object.freeze({
                transparentBgFallback: ''
            })
        }),
        'middlefun': Object.freeze({
            key: 'middlefun',
            displayName: 'middlefun',
            domains: Object.freeze(['middlefun.com']),
            family: '2libra-like',
            settings: Object.freeze({
                titleQuickView: 'middlefunClickTitleQuickView',
                backToTop: 'middlefunShowBackToTopButton',
                modalWidth: 'middlefunQuickViewModalWidth'
            }),
            features: Object.freeze({
                skipInitInEmbeddedFrame: true,
                lazyListItemProcessing: true,
                listQuickButtonEnabled: false,
                previewHidePromotions: true,
                previewUse2LibraLikeScrollMode: true,
                notificationsQuickView: false,
                v2exTopicFilter: false,
                backToTopUseTallestCardFallback: false
            }),
            selectors: Object.freeze({
                backToTopAnchors: Object.freeze(['div.lg\\:col-span-7.pb-12', '.lg\\:col-span-7.pb-12'])
            }),
            urlRules: Object.freeze({
                previewPathPattern: /^\/posts\/[^/]+\/[^/]+$/i,
                postPathPattern: /^\/posts\/[^/]+\/[^/]+$/i
            }),
            defaults: Object.freeze({
                backToTopEnabled: true
            }),
            styles: Object.freeze({
                transparentBgFallback: ''
            })
        }),
        'v2ex': Object.freeze({
            key: 'v2ex',
            displayName: 'V2EX',
            domains: Object.freeze(['v2ex.com']),
            family: 'v2ex',
            settings: Object.freeze({
                titleQuickView: 'v2exClickTitleQuickView',
                backToTop: 'v2exShowBackToTopButton',
                modalWidth: 'v2exQuickViewModalWidth'
            }),
            features: Object.freeze({
                skipInitInEmbeddedFrame: false,
                lazyListItemProcessing: false,
                listQuickButtonEnabled: false,
                previewHidePromotions: false,
                previewUse2LibraLikeScrollMode: false,
                notificationsQuickView: false,
                v2exTopicFilter: true,
                backToTopUseTallestCardFallback: false
            }),
            selectors: Object.freeze({
                backToTopAnchors: Object.freeze(['#Main .box', 'div.box', '.box'])
            }),
            urlRules: Object.freeze({
                previewPathPattern: /^\/t\/\d+$/,
                topicPathPattern: /^\/t\/\d+$/
            }),
            defaults: Object.freeze({
                backToTopEnabled: true
            }),
            styles: Object.freeze({
                transparentBgFallback: '#f5f5f5'
            })
        }),
        'linuxdo': Object.freeze({
            key: 'linuxdo',
            displayName: 'linux.do',
            domains: Object.freeze(['linux.do']),
            family: 'discourse',
            settings: Object.freeze({
                titleQuickView: 'linuxdoClickTitleQuickView',
                backToTop: 'linuxdoShowBackToTopButton',
                modalWidth: 'linuxdoQuickViewModalWidth'
            }),
            features: Object.freeze({
                skipInitInEmbeddedFrame: false,
                lazyListItemProcessing: false,
                listQuickButtonEnabled: false,
                previewHidePromotions: false,
                previewUse2LibraLikeScrollMode: false,
                notificationsQuickView: false,
                v2exTopicFilter: false,
                backToTopUseTallestCardFallback: false
            }),
            selectors: Object.freeze({
                backToTopAnchors: Object.freeze(['.topic-list', '.topic-body', '#main-outlet'])
            }),
            urlRules: Object.freeze({
                previewPathPattern: /^\/t\/[^/]+\/\d+(?:\/\d+)?$/i,
                topicPathPattern: /^\/t\/[^/]+\/\d+(?:\/\d+)?$/i
            }),
            defaults: Object.freeze({
                backToTopEnabled: true
            }),
            styles: Object.freeze({
                transparentBgFallback: '#f6f7f9'
            })
        })
    });
    const SITE_CONFIG_LIST = Object.freeze(Object.values(SITE_CONFIGS));
    const DEFAULT_SITE_KEY = '2libra';
    const DEFAULT_MODAL_WIDTH_PERCENT = 60;
    const QUICK_VIEW_MODAL_WIDTH_SETTING_KEYS = Object.freeze(
        SITE_CONFIG_LIST
            .map(siteConfig => siteConfig.settings ? siteConfig.settings.modalWidth : '')
            .filter(Boolean)
    );

    function isQuickViewModalWidthSettingKey(settingKey) {
        return QUICK_VIEW_MODAL_WIDTH_SETTING_KEYS.includes(settingKey);
    }

    function normalizeModalWidthPercent(value, fallbackValue = DEFAULT_MODAL_WIDTH_PERCENT) {
        const parsedValue = Number(String(value ?? '').replace('%', '').trim());
        if (!Number.isFinite(parsedValue)) {
            return fallbackValue;
        }
        const roundedValue = Math.round(parsedValue);
        return Math.min(90, Math.max(60, roundedValue));
    }

    function isDomainOrSubdomain(hostname, domain) {
        return hostname === domain || hostname.endsWith(`.${domain}`);
    }

    function getSiteConfigByKey(siteKey) {
        return SITE_CONFIGS[siteKey] || null;
    }

    function getSiteConfigByHostname(hostname = window.location.hostname) {
        return SITE_CONFIG_LIST.find(siteConfig => {
            return siteConfig.domains.some(domain => isDomainOrSubdomain(hostname, domain));
        }) || null;
    }

    function getCurrentSiteConfig(hostname = window.location.hostname) {
        return getSiteConfigByHostname(hostname);
    }

    function getCurrentSiteKey(hostname = window.location.hostname) {
        const currentSiteConfig = getCurrentSiteConfig(hostname);
        return currentSiteConfig ? currentSiteConfig.key : 'unknown';
    }
    function isCurrentSiteFeatureEnabled(featureKey) {
        const currentSiteConfig = getCurrentSiteConfig() || getSiteConfigByKey(DEFAULT_SITE_KEY);
        return Boolean(currentSiteConfig && currentSiteConfig.features && currentSiteConfig.features[featureKey]);
    }

    function getSiteConfigFromUrl(url = window.location.href) {
        try {
            const parsedUrl = new URL(url, window.location.href);
            return getSiteConfigByHostname(parsedUrl.hostname);
        } catch (error) {
            return getCurrentSiteConfig();
        }
    }

    function getSiteKeyFromUrl(url = window.location.href) {
        const siteConfig = getSiteConfigFromUrl(url);
        return siteConfig ? siteConfig.key : 'unknown';
    }

    function isUrlMatchedBySiteRule(url, siteKey, ruleKey) {
        try {
            const parsedUrl = new URL(url, window.location.href);
            const siteConfig = getSiteConfigByKey(siteKey);
            if (!siteConfig || !siteConfig.domains.some(domain => isDomainOrSubdomain(parsedUrl.hostname, domain))) {
                return false;
            }

            const pattern = siteConfig.urlRules ? siteConfig.urlRules[ruleKey] : null;
            if (!(pattern instanceof RegExp)) {
                return true;
            }

            return pattern.test(parsedUrl.pathname);
        } catch (error) {
            return false;
        }
    }

    function getTitleQuickViewSettingKeyForUrl(url, fallbackKey = 'clickTitleQuickView') {
        const siteConfig = getSiteConfigFromUrl(url);
        return siteConfig && siteConfig.settings ? siteConfig.settings.titleQuickView : fallbackKey;
    }
    function getQuickViewModalWidthSettingKeyForUrl(url, fallbackKey = 'quickViewModalWidth') {
        const siteConfig = getSiteConfigFromUrl(url);
        return siteConfig && siteConfig.settings ? siteConfig.settings.modalWidth : fallbackKey;
    }

    function getQuickViewModalWidthPercentForUrl(url, fallbackValue = DEFAULT_MODAL_WIDTH_PERCENT) {
        const widthSettingKey = getQuickViewModalWidthSettingKeyForUrl(url, 'quickViewModalWidth');
        return normalizeModalWidthPercent(Settings[widthSettingKey], fallbackValue);
    }

    function refreshActiveQuickViewModalWidth() {
        const modal = document.getElementById(CONFIG.modalId);
        if (!modal || !modal.classList.contains('active')) return;

        const activeSiteKey = modal.dataset.forummateSite || getCurrentSiteKey();
        const activeSiteConfig = getSiteConfigByKey(activeSiteKey);
        const widthSettingKey = activeSiteConfig && activeSiteConfig.settings
            ? activeSiteConfig.settings.modalWidth
            : 'quickViewModalWidth';
        const widthPercent = normalizeModalWidthPercent(Settings[widthSettingKey], DEFAULT_MODAL_WIDTH_PERCENT);
        modal.style.setProperty('--forummate-modal-width', `${widthPercent}%`);
    }
    const FORUMMATE_SITE_CLASS = 'forummate-site-' + getCurrentSiteKey();
    document.documentElement.classList.add(FORUMMATE_SITE_CLASS);

    const TOP_BUTTON_HORIZONTAL_OFFSET = 12;
    const MODAL_Z_INDEX_BASE = 1100;
    const FRAME_ESCAPE_HANDLER_PROP = '__forummateEscapeHandler';

    function isEmbeddedFrame() {
        try {
            return window.self !== window.top;
        } catch (error) {
            return true;
        }
    }

    // 2libra-like quick preview uses a same-origin iframe; skip re-initializing inside it.
    if (isCurrentSiteFeatureEnabled('skipInitInEmbeddedFrame') && isEmbeddedFrame()) {
        console.log('ForumMate Script: Skip initialization inside embedded preview iframe.');
        return;
    }

    function isV2exTopicUrl(url) {
        return isUrlMatchedBySiteRule(url, 'v2ex', 'topicPathPattern');
    }

    function isLinuxDoTopicUrl(url) {
        return isUrlMatchedBySiteRule(url, 'linuxdo', 'topicPathPattern');
    }

    function isMiddlefunPostUrl(url) {
        return isUrlMatchedBySiteRule(url, 'middlefun', 'postPathPattern');
    }

    function resolveQuickPreviewSiteKey(url = window.location.href) {
        try {
            const parsedUrl = new URL(url, window.location.href);
            const siteConfig = getSiteConfigByHostname(parsedUrl.hostname);
            if (!siteConfig) return '2libra';

            const previewPattern = siteConfig.urlRules ? siteConfig.urlRules.previewPathPattern : null;
            if (previewPattern instanceof RegExp && !previewPattern.test(parsedUrl.pathname)) {
                return '2libra';
            }

            return siteConfig.key;
        } catch (error) {
            return '2libra';
        }
    }

    function isTransparentColor(colorValue) {
        return !colorValue || colorValue === 'rgba(0, 0, 0, 0)' || colorValue === 'transparent';
    }

    // Inject shared styles
    const style = document.createElement('style');
    style.textContent = `
        /* SpinKit CSS */
        @keyframes sk-chase {
          100% { transform: rotate(360deg); }
        }

        .sk-chase {
          width: 40px;
          height: 40px;
          position: relative;
          animation: sk-chase 2.0s infinite linear both;
        }

        .sk-chase-dot {
          width: 100%;
          height: 100%;
          position: absolute;
          left: 0;
          top: 0;
          animation: sk-chase 2.0s infinite ease-in-out both;
        }

        .sk-chase-dot:before {
          content: '';
          display: block;
          width: 25%;
          height: 25%;
          background-color: var(--color-primary, #5b6b8c);
          border-radius: 100%;
          animation: sk-chase-dot 2.0s infinite ease-in-out both;
        }

        .sk-chase-dot:nth-child(1) { animation-delay: -1.1s; }
        .sk-chase-dot:nth-child(2) { animation-delay: -1.0s; }
        .sk-chase-dot:nth-child(3) { animation-delay: -0.9s; }
        .sk-chase-dot:nth-child(4) { animation-delay: -0.8s; }
        .sk-chase-dot:nth-child(5) { animation-delay: -0.7s; }
        .sk-chase-dot:nth-child(6) { animation-delay: -0.6s; }

        @keyframes sk-chase-dot {
          80%, 100% {
            transform: rotate(360deg);
          }
        }

        /* Pulse animation */
        @keyframes sk-pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }

        .sk-pulse {
          width: 40px;
          height: 40px;
          background-color: var(--color-primary, #5b6b8c);
          border-radius: 50%;
          animation: sk-pulse 1.5s infinite ease-in-out;
        }

        /* Ripple animation */
        @keyframes sk-ripple {
          0% { transform: scale(0); opacity: 1; }
          100% { transform: scale(1); opacity: 0; }
        }

        .sk-ripple {
          width: 40px;
          height: 40px;
          position: relative;
        }

        .sk-ripple:before,
        .sk-ripple:after {
          content: '';
          position: absolute;
          border: 2px solid var(--color-primary, #5b6b8c);
          border-radius: 50%;
          animation: sk-ripple 1.5s infinite;
        }

        .sk-ripple:after {
          animation-delay: 0.5s;
        }

        /* Rotating block */
        @keyframes sk-rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .sk-rotate {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(91, 107, 140, 0.3);
          border-top: 3px solid var(--color-primary, #5b6b8c);
          border-radius: 50%;
          animation: sk-rotate 1.2s infinite linear;
        }

        /* Bounce animation */
        @keyframes sk-bounce {
          0%, 80%, 100% { transform: scale(0); }
          10% { transform: scale(1.0); }
          50% { transform: scale(1.0); }
        }

        .sk-bounce {
          width: 40px;
          height: 40px;
          position: relative;
        }

        .sk-bounce:before,
        .sk-bounce:after {
          content: '';
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background-color: var(--color-primary, #5b6b8c);
          animation: sk-bounce 1.4s infinite ease-in-out both;
        }

        .sk-bounce:after {
          animation-delay: -0.16s;
        }

        /* Wave animation */
        @keyframes sk-wave {
          0% { transform: rotate(0deg); }
          10% { transform: rotate(14deg); }
          20% { transform: rotate(-8deg); }
          30% { transform: rotate(14deg); }
          40% { transform: rotate(-4deg); }
          50% { transform: rotate(10deg); }
          60% { transform: rotate(0deg); }
          100% { transform: rotate(0deg); }
        }

        .sk-wave {
          width: 40px;
          height: 40px;
          position: relative;
        }

        .sk-wave:before,
        .sk-wave:after {
          content: '';
          position: absolute;
          top: 0;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background-color: var(--color-primary, #5b6b8c);
          animation: sk-wave 1.3s infinite ease-in-out;
        }

        .sk-wave:after {
          animation-delay: -0.3s;
        }

        /* Cube grid animation */
        @keyframes sk-cube {
          0%, 70%, 100% { transform: scale3D(1, 1, 1); }
          35% { transform: scale3D(0, 0, 1); }
        }

        .sk-cube-grid {
          width: 40px;
          height: 40px;
        }

        .sk-cube-grid .sk-cube {
          width: 33%;
          height: 33%;
          background-color: var(--color-primary, #5b6b8c);
          float: left;
          animation: sk-cube 1.3s infinite ease-in-out;
        }

        .sk-cube-grid .sk-cube:nth-child(1) { animation-delay: 0.2s; }
        .sk-cube-grid .sk-cube:nth-child(2) { animation-delay: 0.3s; }
        .sk-cube-grid .sk-cube:nth-child(3) { animation-delay: 0.4s; }
        .sk-cube-grid .sk-cube:nth-child(4) { animation-delay: 0.1s; }
        .sk-cube-grid .sk-cube:nth-child(5) { animation-delay: 0.2s; }
        .sk-cube-grid .sk-cube:nth-child(6) { animation-delay: 0.3s; }
        .sk-cube-grid .sk-cube:nth-child(7) { animation-delay: 0.0s; }
        .sk-cube-grid .sk-cube:nth-child(8) { animation-delay: 0.1s; }
        .sk-cube-grid .sk-cube:nth-child(9) { animation-delay: 0.2s; }
        .forummate-quick-btn {
            position: absolute;
            padding: 2px 8px;
            font-size: 12px;
            cursor: pointer;
            border-radius: 4px;
            background-color: var(--color-primary, #5b6b8c);
            color: #fff;
            border: none;
            display: none;
            white-space: nowrap;
            z-index: 10;
            opacity: 0;
            transform: translateY(-50%);
            transition: opacity 0.2s;
        }
        
        .forummate-post-item:hover .forummate-quick-btn {
            display: block;
            opacity: 1;
        }

        .forummate-quick-btn:hover {
            opacity: 0.9;
        }

        /* 鑷畾涔夎繑鍥為《閮ㄦ寜閽?*/
        #custom-back-to-top {
            position: fixed;
            z-index: 900;
            width: 48px;
            height: 48px;
            border-radius: 14px; /* 鏇村姞鍦嗘鼎鐨勭煩褰紝绫讳技 iOS 椋庢牸 */
            background: rgba(255, 255, 255, 0.8);
            backdrop-filter: blur(12px) saturate(180%);
            -webkit-backdrop-filter: blur(12px) saturate(180%);
            color: var(--color-primary, #5b6b8c);
            border: 1px solid rgba(255, 255, 255, 0.3);
            cursor: pointer;
            display: none;
            justify-content: center;
            align-items: center;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            opacity: 0;
            transform: translateY(20px);
        }
        
        #custom-back-to-top.visible {
            display: flex;
            opacity: 1;
            transform: translateY(0);
        }

        #custom-back-to-top:hover {
            background: var(--color-primary, #5b6b8c);
            color: #fff;
            transform: translateY(-4px);
            box-shadow: 0 12px 40px rgba(91, 107, 140, 0.2);
            border-color: transparent;
        }

        #custom-back-to-top svg {
            width: 24px;
            height: 24px;
            transition: transform 0.3s ease;
        }

        #custom-back-to-top:hover svg {
            transform: translateY(-2px);
        }

        #${CONFIG.modalId} {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.5);
            z-index: ${MODAL_Z_INDEX_BASE};
            display: flex;
            justify-content: center;
            align-items: center;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s;
        }
        #${CONFIG.modalId}.active {
            opacity: 1;
            pointer-events: auto;
        }
        #${CONFIG.modalId} .modal-content {
            width: min(var(--forummate-modal-width, 60%), calc(100vw - 16px));
            max-width: none;
            height: 92%;
            background: var(--base-100, var(--forummate-dynamic-bg, #fff));
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            position: relative;
        }
        #${CONFIG.modalId} .modal-header {
            padding: 10px 20px;
            border-bottom: 1px solid rgba(0,0,0,0.1);
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: var(--base-100, var(--forummate-dynamic-bg, #fff));
        }
        #${CONFIG.modalId}[data-forummate-site="v2ex"] .modal-content,
        #${CONFIG.modalId}[data-forummate-site="v2ex"] .modal-header {
            background: var(--forummate-dynamic-bg, #fff);
        }
        #${CONFIG.modalId}[data-forummate-site="middlefun"] .btn-go-thread,
        #${CONFIG.modalId}[data-forummate-site="v2ex"] .btn-go-thread {
            background-color: #e5e7eb;
            color: #374151;
        }
        #${CONFIG.modalId}[data-forummate-site="middlefun"] .btn-go-thread:hover,
        #${CONFIG.modalId}[data-forummate-site="v2ex"] .btn-go-thread:hover {
            background-color: #d1d5db;
            opacity: 1;
        }
        #${CONFIG.modalId} .modal-title {
            font-weight: bold;
            font-size: 16px;
        }
        #${CONFIG.modalId} .modal-actions {
            display: flex;
            gap: 12px;
            align-items: center;
        }
        #${CONFIG.modalId} .btn-go-thread {
            padding: 6px 16px;
            background-color: var(--color-primary, #5b6b8c);
            color: #fff;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            transition: background 0.2s;
        }
        #${CONFIG.modalId} .btn-go-thread:hover {
            opacity: 0.9;
        }
        #${CONFIG.modalId} .btn-close-large {
            padding: 6px 16px;
            background-color: #e5e7eb;
            color: #374151;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            transition: background 0.2s;
        }
        #${CONFIG.modalId} .btn-close-large:hover {
            background-color: #d1d5db;
        }

        /* Loading placeholder styles */
        .forummate-modal-loading {
            position: absolute;
            top: 60px;
            left: 0;
            right: 0;
            bottom: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--forummate-dynamic-bg);
            z-index: 50;
        }

        .loading-content {
            text-align: center;
            color: var(--color-primary, #5b6b8c);
            width: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }

        .loading-content p {
            margin: 20px 0 0 0;
            font-size: 16px;
            font-weight: 500;
        }

        #${CONFIG.modalId} iframe {
            width: 100%;
            height: 100%;
            border: none;
            background: transparent;
            opacity: 0;
            transition: opacity 0.3s;
        }



        /* Title link visual hint */
        .forummate-title-link-quick-view {
            cursor: pointer !important;
        }

        /* Toast styles */
        .forummate-toast {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10001;
            padding: 12px 20px;
            background: var(--base-100, #fff);
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            border-left: 4px solid var(--color-primary, #5b6b8c);
            font-size: 14px;
            color: var(--color-primary, #5b6b8c);
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
            pointer-events: none;
            max-width: 300px;
            word-wrap: break-word;
        }

        .forummate-toast.show {
            opacity: 1;
            transform: translateX(0);
            pointer-events: auto;
        }

        .forummate-toast.success {
            border-left-color: #10b981;
            color: #10b981;
        }

        .forummate-toast.info {
            border-left-color: var(--color-primary, #5b6b8c);
            color: var(--color-primary, #5b6b8c);
        }

        #${CONFIG.settingsButtonId} {
            position: fixed;
            right: 24px;
            bottom: 24px;
            z-index: ${MODAL_Z_INDEX_BASE - 1};
            height: 48px;
            padding: 0 16px;
            border-radius: 16px;
            background: rgba(255, 255, 255, 0.82);
            backdrop-filter: blur(12px) saturate(180%);
            -webkit-backdrop-filter: blur(12px) saturate(180%);
            color: var(--color-primary, #5b6b8c);
            border: 1px solid rgba(255, 255, 255, 0.32);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04);
            display: inline-flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.25s ease;
        }

        #${CONFIG.settingsButtonId}:hover {
            background: var(--color-primary, #5b6b8c);
            color: #fff;
            transform: translateY(-2px);
            box-shadow: 0 12px 40px rgba(91, 107, 140, 0.2);
            border-color: transparent;
        }

        #${CONFIG.settingsButtonId} svg {
            width: 18px;
            height: 18px;
        }

        #${CONFIG.settingsModalId} {
            position: fixed;
            inset: 0;
            z-index: ${MODAL_Z_INDEX_BASE + 2};
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 16px;
            background: rgba(0, 0, 0, 0.5);
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease;
        }

        #${CONFIG.settingsModalId}.active {
            opacity: 1;
            pointer-events: auto;
        }

        #${CONFIG.settingsModalId} .settings-panel {
            width: min(500px, 100%);
            max-height: min(84vh, 820px);
            display: flex;
            flex-direction: column;
            background: var(--base-100, var(--forummate-dynamic-bg, #fff));
            border-radius: 20px;
            box-shadow: 0 24px 60px rgba(0, 0, 0, 0.18);
            overflow: hidden;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }

        #${CONFIG.settingsModalId} .settings-header,
        #${CONFIG.settingsModalId} .settings-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            padding: 14px 16px;
            background: var(--base-100, var(--forummate-dynamic-bg, #fff));
        }

        #${CONFIG.settingsModalId}[data-forummate-site="v2ex"] .settings-panel,
        #${CONFIG.settingsModalId}[data-forummate-site="v2ex"] .settings-header,
        #${CONFIG.settingsModalId}[data-forummate-site="v2ex"] .settings-footer {
            background: var(--forummate-dynamic-bg, #fff);
        }
        #${CONFIG.settingsModalId} .settings-header {
            border-bottom: 1px solid rgba(0, 0, 0, 0.08);
        }

        #${CONFIG.settingsModalId} .settings-title {
            font-size: 16px;
            font-weight: 700;
            color: #111827;
        }

        #${CONFIG.settingsModalId} .settings-subtitle {
            margin-top: 2px;
            font-size: 12px;
            color: #6b7280;
        }

        #${CONFIG.settingsModalId} .settings-body {
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            flex: 1;
            min-height: 0;
            overflow-y: auto;
        }

        #${CONFIG.settingsModalId} .settings-intro {
            margin: 0;
            font-size: 12px;
            color: #4b5563;
            line-height: 1.5;
        }

        #${CONFIG.settingsModalId} .settings-actions {
            display: flex;
            gap: 8px;
        }

        #${CONFIG.settingsModalId} .btn-settings-action {
            appearance: none;
            border: 1px solid rgba(0, 0, 0, 0.12);
            background: rgba(255, 255, 255, 0.92);
            color: #334155;
            border-radius: 10px;
            padding: 6px 10px;
            font-size: 12px;
            line-height: 1;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        #${CONFIG.settingsModalId} .btn-settings-action:hover {
            border-color: rgba(0, 0, 0, 0.22);
            background: #fff;
        }

        #${CONFIG.settingsModalId} .settings-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        #${CONFIG.settingsModalId} .settings-group-toggle {
            appearance: none;
            width: 100%;
            border: 1px solid rgba(0, 0, 0, 0.08);
            border-radius: 12px;
            background: rgba(255, 255, 255, 0.78);
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            padding: 10px 12px;
            cursor: pointer;
            transition: border-color 0.2s ease, background 0.2s ease;
        }

        #${CONFIG.settingsModalId} .settings-group:not(.is-collapsed) .settings-group-toggle {
            border-color: rgba(79, 70, 229, 0.24);
            background: rgba(255, 255, 255, 0.92);
        }

        #${CONFIG.settingsModalId} .settings-group-title {
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.02em;
            color: #4f46e5;
            text-align: left;
        }

        #${CONFIG.settingsModalId} .settings-group-chevron {
            color: #64748b;
            font-size: 12px;
            transition: transform 0.2s ease;
        }

        #${CONFIG.settingsModalId} .settings-group.is-collapsed .settings-group-chevron {
            transform: rotate(-90deg);
        }

        #${CONFIG.settingsModalId} .settings-group-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-left: 12px;
            padding: 10px 10px 10px 12px;
            border-left: 2px solid rgba(79, 70, 229, 0.22);
            border-radius: 12px;
            background: linear-gradient(180deg, rgba(79, 70, 229, 0.06), rgba(79, 70, 229, 0.02));
        }

        #${CONFIG.settingsModalId} .settings-group.is-collapsed .settings-group-list {
            display: none;
        }
        #${CONFIG.settingsModalId} .settings-subgroup {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-left: 10px;
            padding-left: 10px;
            border-left: 2px dashed rgba(79, 70, 229, 0.22);
        }
        #${CONFIG.settingsModalId} .settings-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            padding: 9px 12px;
            border-radius: 12px;
            border: 1px solid rgba(0, 0, 0, 0.06);
            background: rgba(255, 255, 255, 0.72);
        }
        #${CONFIG.settingsModalId} .settings-item-stack {
            display: flex;
            flex-direction: column;
            gap: 6px;
            padding: 10px 12px;
            border-radius: 12px;
            border: 1px solid rgba(0, 0, 0, 0.06);
            background: rgba(255, 255, 255, 0.72);
        }
        #${CONFIG.settingsModalId} .settings-copy {
            min-width: 0;
            flex: 1;
        }
        #${CONFIG.settingsModalId} .settings-name {
            display: block;
            font-size: 13px;
            font-weight: 600;
            color: #111827;
        }
        #${CONFIG.settingsModalId} .settings-description {
            display: block;
            margin-top: 2px;
            font-size: 11px;
            line-height: 1.4;
            color: #6b7280;
        }
        #${CONFIG.settingsModalId} .settings-input,
        #${CONFIG.settingsModalId} .settings-textarea {
            width: 100%;
            border: 1px solid rgba(0, 0, 0, 0.12);
            border-radius: 10px;
            padding: 8px 10px;
            font-size: 12px;
            line-height: 1.45;
            color: #111827;
            background: rgba(255, 255, 255, 0.96);
            box-sizing: border-box;
        }
        #${CONFIG.settingsModalId} .settings-input:focus,
        #${CONFIG.settingsModalId} .settings-textarea:focus {
            outline: none;
            border-color: rgba(79, 70, 229, 0.5);
            box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.12);
        }
        #${CONFIG.settingsModalId} .settings-textarea {
            min-height: 68px;
            resize: vertical;
        }
        #${CONFIG.settingsModalId} .settings-switch {
            position: relative;
            flex-shrink: 0;
            width: 44px;
            height: 26px;
        }
        #${CONFIG.settingsModalId} .settings-switch input {
            position: absolute;
            inset: 0;
            opacity: 0;
            cursor: pointer;
        }
        #${CONFIG.settingsModalId} .settings-slider {
            position: absolute;
            inset: 0;
            border-radius: 999px;
            background: #d1d5db;
            transition: background 0.25s ease;
        }
        #${CONFIG.settingsModalId} .settings-slider::after {
            content: '';
            position: absolute;
            top: 4px;
            left: 4px;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: #fff;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.16);
            transition: transform 0.25s ease;
        }
        #${CONFIG.settingsModalId} .settings-switch input:checked + .settings-slider {
            background: var(--color-primary, #5b6b8c);
        }
        #${CONFIG.settingsModalId} .settings-switch input:checked + .settings-slider::after {
            transform: translateX(18px);
        }
        #${CONFIG.settingsModalId} .settings-footer {
            border-top: 1px solid rgba(0, 0, 0, 0.08);
            justify-content: space-between;
        }
        #${CONFIG.settingsModalId} .settings-footer-actions {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-left: auto;
        }

        #${CONFIG.settingsModalId} .btn-appreciation-settings,
        #${CONFIG.settingsModalId} .btn-feedback-settings,
        #${CONFIG.settingsModalId} .btn-close-settings {
            border: none;
            border-radius: 9px;
            padding: 6px 12px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        #${CONFIG.settingsModalId} .btn-appreciation-settings,
        #${CONFIG.settingsModalId} .btn-feedback-settings {
            background: rgba(17, 24, 39, 0.06);
            color: #111827;
        }

        #${CONFIG.settingsModalId} .btn-appreciation-settings:hover,
        #${CONFIG.settingsModalId} .btn-feedback-settings:hover {
            background: rgba(17, 24, 39, 0.12);
        }

        #${CONFIG.settingsModalId} .btn-close-settings {
            background: var(--color-primary, #5b6b8c);
            color: #fff;
        }

        #${CONFIG.settingsModalId} .btn-close-settings:hover {
            opacity: 0.92;
        }

        @media (max-width: 640px) {
            #${CONFIG.settingsButtonId} {
                width: 48px;
                padding: 0;
                justify-content: center;
            }

            #${CONFIG.settingsButtonId} .settings-button-label {
                display: none;
            }

            #${CONFIG.settingsModalId} .settings-item {
                align-items: flex-start;
            }
        }
        /* Notifications modal styles */
        #notifications-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.5);
            z-index: ${MODAL_Z_INDEX_BASE + 1};
            display: flex;
            justify-content: center;
            align-items: center;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s;
        }
        #notifications-modal.active {
            opacity: 1;
            pointer-events: auto;
        }
        #notifications-modal .modal-content {
            width: 80%;
            max-width: 800px;
            height: 80%;
            background: var(--base-100, var(--forummate-dynamic-bg, #fff));
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            position: relative;
        }
        #notifications-modal .modal-header {
            padding: 10px 20px;
            border-bottom: 1px solid rgba(0,0,0,0.1);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        #notifications-modal .modal-title {
            font-weight: bold;
        }
        #notifications-modal .modal-actions {
            display: flex;
            gap: 10px;
        }
        #notifications-modal .btn-close {
             padding: 4px 12px;
            background-color: #e5e7eb;
            color: #374151;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
        }
        #notifications-modal .btn-back-notifications {
             padding: 4px 12px;
            background-color: var(--color-primary, #5b6b8c);
            color: #fff;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
        }
        #notifications-modal .btn-back-notifications:hover {
            opacity: 0.9;
        }
        #notifications-modal iframe {
            width: 100%;
            height: 100%;
            border: none;
        }
    `;
    document.head.appendChild(style);

    // Create the modal container
    function createModal() {
        if (document.getElementById(CONFIG.modalId)) return;

        // Pick a random loading animation and text
        const { animation, text } = getRandomLoadingContent();

        const modal = document.createElement('div');
        modal.id = CONFIG.modalId;
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <span class="modal-title">快速查看</span>
                    <div class="modal-actions">
                        <button class="btn-go-thread">进入帖子 ↗</button>
                        <button class="btn-close-large">关闭</button>
                    </div>
                </div>

                <!-- Loading placeholder -->
                <div class="forummate-modal-loading" id="modal-loading">
                    <div class="loading-content">
                        ${animation.html}
                        <p class="loading-text">${text}</p>
                    </div>
                </div>

                <iframe id="${CONFIG.iframeId}" src=""></iframe>
            </div>
        `;
        
        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
        
        // Bind close button
        modal.querySelector('.btn-close-large').addEventListener('click', closeModal);
        
        document.body.appendChild(modal);
    }

    function apply2LibraLikePreviewScrollMode(doc) {
        if (!doc) return;

        const mainContent = doc.querySelector('[data-main-left="true"]');
        if (mainContent) {
            doc.documentElement.style.setProperty('overflow', 'hidden', 'important');
            doc.body.style.setProperty('overflow', 'hidden', 'important');
            mainContent.style.setProperty('overflow-y', 'auto', 'important');
            mainContent.style.setProperty('overflow-x', 'hidden', 'important');
            return;
        }

        // Fallback for compatible sites without [data-main-left="true"] (e.g. middlefun)
        doc.documentElement.style.setProperty('overflow-y', 'auto', 'important');
        doc.documentElement.style.setProperty('overflow-x', 'hidden', 'important');
        doc.body.style.setProperty('overflow-y', 'auto', 'important');
        doc.body.style.setProperty('overflow-x', 'hidden', 'important');
    }
    function bindEscapeKeyForIframe(iframe, closeHandler) {
        if (!iframe || typeof closeHandler !== 'function') return;

        try {
            const iframeWindow = iframe.contentWindow;
            if (!iframeWindow || typeof iframeWindow.addEventListener !== 'function') return;

            unbindEscapeKeyForIframe(iframe);
            const handleEscape = event => {
                if (event.key !== 'Escape') return;
                event.preventDefault();
                event.stopPropagation();
                closeHandler();
            };

            iframeWindow.addEventListener('keydown', handleEscape, true);
            iframe[FRAME_ESCAPE_HANDLER_PROP] = handleEscape;
        } catch (error) {
            // Ignore cross-origin iframe access errors.
        }
    }
    function unbindEscapeKeyForIframe(iframe) {
        if (!iframe) return;
        const existingHandler = iframe[FRAME_ESCAPE_HANDLER_PROP];
        if (!existingHandler) return;

        try {
            const iframeWindow = iframe.contentWindow;
            if (iframeWindow && typeof iframeWindow.removeEventListener === 'function') {
                iframeWindow.removeEventListener('keydown', existingHandler, true);
            }
        } catch (error) {
            // Ignore cleanup errors on iframe teardown.
        }

        delete iframe[FRAME_ESCAPE_HANDLER_PROP];
    }
    function openModal(url, title) {
        createModal();
        const modal = document.getElementById(CONFIG.modalId);

        // Resolve page background dynamically to avoid transparent modal issues
        const previewSiteKey = resolveQuickPreviewSiteKey(url);
        const previewSiteConfig = getSiteConfigByKey(previewSiteKey) || getSiteConfigByKey('2libra');
        let bg = window.getComputedStyle(document.body).backgroundColor;
        if (isTransparentColor(bg)) {
            bg = window.getComputedStyle(document.documentElement).backgroundColor;
        }

        const transparentBgFallback = previewSiteConfig && previewSiteConfig.styles
            ? previewSiteConfig.styles.transparentBgFallback
            : '';
        if (transparentBgFallback && isTransparentColor(bg)) {
            bg = transparentBgFallback;
        }

        modal.style.setProperty('--forummate-dynamic-bg', bg);
        modal.dataset.forummateSite = previewSiteKey;
        const modalWidthPercent = getQuickViewModalWidthPercentForUrl(url, DEFAULT_MODAL_WIDTH_PERCENT);
        modal.style.setProperty('--forummate-modal-width', String(modalWidthPercent) + '%');

        const iframe = document.getElementById(CONFIG.iframeId);
        const titleEl = modal.querySelector('.modal-title');
        const goBtn = modal.querySelector('.btn-go-thread');
        const loadingEl = document.getElementById('modal-loading');

        // Refresh loading animation and text
        if (loadingEl) {
            const { animation, text } = getRandomLoadingContent();
            const loadingContent = loadingEl.querySelector('.loading-content');
            if (loadingContent) {
                loadingContent.innerHTML = `${animation.html}<p class="loading-text">${text}</p>`;
            }
        }

        // Show the loading placeholder before the iframe content is ready
        if (loadingEl) loadingEl.style.display = 'flex';
        iframe.style.backgroundColor = bg;
        iframe.style.opacity = '0';
        unbindEscapeKeyForIframe(iframe);

        iframe.src = url;
        titleEl.textContent = title || '快速查看';

        // Bind the open-thread action
        goBtn.onclick = () => {
            window.location.href = url;
        };

        modal.classList.add('active');
        syncBodyScrollLock();

        iframe.onload = () => {
            bindEscapeKeyForIframe(iframe, closeModal);
            try {
                const doc = iframe.contentDocument;
                const css = getQuickPreviewFrameCss(url, bg);
                const style = doc.createElement('style');
                style.textContent = css;
                doc.head.appendChild(style);

                if (previewSiteConfig && previewSiteConfig.features && previewSiteConfig.features.previewHidePromotions) {
                    const hidePreviewPromoCards = () => {
                        doc.querySelectorAll('img[src*="/promotion/"]').forEach(image => {
                            const promoCard = image.closest('.card.card-border.cursor-pointer') || image.closest('[role="link"][tabindex="0"]')?.closest('.card.card-border');
                            if (promoCard) {
                                promoCard.style.display = 'none';
                            }
                        });
                    };

                    hidePreviewPromoCards();
                    const previewPromoObserver = new MutationObserver(() => {
                        hidePreviewPromoCards();
                    });
                    previewPromoObserver.observe(doc.body, { childList: true, subtree: true });
                }

                if (previewSiteConfig && previewSiteConfig.features && previewSiteConfig.features.previewUse2LibraLikeScrollMode) {
                    apply2LibraLikePreviewScrollMode(doc);
                }
                if (previewSiteKey === 'linuxdo') {
                    const removeLinuxDoSidebarWrapper = () => {
                        doc.querySelectorAll('.sidebar-wrapper').forEach(sidebarWrapper => {
                            const parentElement = sidebarWrapper.parentElement;
                            const parentClassName = parentElement && typeof parentElement.className === 'string'
                                ? parentElement.className
                                : '';
                            const shouldRemoveParent = parentElement && /sidebar-(container|column)|\bsidebar\b/i.test(parentClassName);

                            if (shouldRemoveParent) {
                                parentElement.remove();
                            } else {
                                sidebarWrapper.remove();
                            }
                        });

                        doc.body.classList.remove('has-sidebar-page');
                        doc.documentElement.classList.remove('has-sidebar-page');

                        const mainOutletWrapper = doc.querySelector('#main-outlet-wrapper');
                        if (mainOutletWrapper) {
                            mainOutletWrapper.style.setProperty('grid-template-columns', 'minmax(0, 1fr)', 'important');
                            mainOutletWrapper.style.setProperty('gap', '0', 'important');
                            mainOutletWrapper.style.setProperty('padding-left', '0', 'important');
                        }
                    };

                    removeLinuxDoSidebarWrapper();
                    const linuxDoSidebarObserver = new MutationObserver(removeLinuxDoSidebarWrapper);
                    linuxDoSidebarObserver.observe(doc.body, { childList: true, subtree: true });
                }

                function scrollToTop() {
                    console.log('ForumMate Script: Loaded and running...');
                    const mainContent = doc.querySelector('[data-main-left="true"]');
                    if (mainContent) {
                        mainContent.scrollTop = 0;
                    } else {
                        doc.documentElement.scrollTop = 0;
                    }
                }

                // Watch URL changes and keep the preview scrolled to the top
                const win = iframe.contentWindow;

                // Patch pushState and replaceState inside the iframe
                const originalPushState = win.history.pushState;
                win.history.pushState = function(state, title, url) {
                    console.log('ForumMate Script: Loaded and running...');
                    originalPushState.apply(this, arguments);
                    scrollToTop();
                };

                // Hide the loading state after styles are injected
                if (loadingEl) loadingEl.style.display = 'none';
                iframe.style.opacity = '1';
            } catch (e) {
                // Fail open so the iframe still becomes visible on errors
                if (loadingEl) loadingEl.style.display = 'none';
                iframe.style.opacity = '1';
            }
        };
    }

    function closeModal() {
        const modal = document.getElementById(CONFIG.modalId);
        const iframe = document.getElementById(CONFIG.iframeId);
        if (modal) {
            modal.classList.remove('active');
            unbindEscapeKeyForIframe(iframe);
            iframe.src = '';
            syncBodyScrollLock();
        }
    }

    function get2LibraQuickPreviewFrameCss(bg) {
        return `
            header, .navbar, aside:not(.EmojiPickerReact), .menu:not(.dropdown-left), [role="banner"], [role="contentinfo"], footer.footer-center { display: none !important; }
            div.breadcrumbs.text-sm.overflow-visible { display: none !important; }
            [data-main-left="true"] {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                width: 100vw !important;
                height: 100vh !important;
                z-index: 900 !important;
                background: var(--base-100, ${bg}) !important;
                overflow-y: auto !important;
                overflow-x: hidden !important;
                padding: 0 20px 20px 20px !important;
                margin: 0 !important;
                border: none !important;
                box-sizing: border-box !important;
            }
            .EmojiPickerReact { z-index: 900 !important; }
            .medium-zoom-overlay { z-index: 900 !important; }
            body, html { overflow: hidden !important; }
        `;
    }

    function getMiddlefunQuickPreviewFrameCss(bg) {
        return `
            ${get2LibraQuickPreviewFrameCss(bg)}
            div.lg\\:col-span-3.mt-6.pb-12,
            .lg\\:col-span-3.mt-6.pb-12,
            [class*="lg:col-span-3"][class*="mt-6"][class*="pb-12"] {
                display: none !important;
            }
            footer,
            footer.footer-center,
            .footer-horizontal,
            [role="contentinfo"] {
                display: none !important;
            }
        `;
    }

    function getV2exQuickPreviewFrameCss(bg) {
        return `
            #Top, #Bottom, #Rightbar, .dock_area { display: none !important; }
            html, body { background: ${bg} !important; overflow-y: auto !important; }            body.has-sidebar-page {
                --d-sidebar-width: 0 !important;
                --d-main-content-gap: 0 !important;
            }
            #main-outlet-wrapper,
            body.has-sidebar-page #main-outlet-wrapper {
                grid-template-areas:
                    "content"
                    "below-content" !important;
                grid-template-columns: minmax(0, 1fr) !important;
                grid-template-rows: 1fr auto !important;
                gap: 0 !important;
                padding-left: 0 !important;
            }            #Wrapper {
                background: ${bg} !important;
                min-width: 0 !important;
                padding: 16px 0 24px !important;
            }
            .content {
                width: min(1080px, calc(100vw - 32px)) !important;
                max-width: none !important;
                margin: 0 auto !important;
            }
            #Main,
            #Leftbar,
            #Rightbar {
                float: none !important;
            }
            #Main {
                width: 100% !important;
                max-width: none !important;
                margin: 0 auto !important;
            }
            #Leftbar {
                max-width: none !important;
                margin: 0 !important;
                padding: 0 !important;
            }
            .box,
            .cell,
            .inner {
                max-width: 100% !important;
                box-sizing: border-box !important;
            }
            .box { border-radius: 12px !important; }
        `;
    }

    function getLinuxDoQuickPreviewFrameCss(bg) {
        return `
            .d-header,
            .d-header-wrap,
            .navigation-container,
            .topic-map,
            .post-notice,
            .topic-above-posts,
            .topic-below-posts-outlet,
            .topic-footer-main-buttons,
            .footer-nav,
            .list-controls,
            .sidebar-wrapper,
            .powered-by-discourse {
                display: none !important;
            }
            html, body { background: ${bg} !important; overflow-y: auto !important; }
            body { min-width: 0 !important; }
            body.has-sidebar-page {
                --d-sidebar-width: 0 !important;
                --d-main-content-gap: 0 !important;
            }
            #main-outlet-wrapper,
            body.has-sidebar-page #main-outlet-wrapper {
                grid-template-areas:
                    "content"
                    "below-content" !important;
                grid-template-columns: minmax(0, 1fr) !important;
                grid-template-rows: 1fr auto !important;
                gap: 0 !important;
                padding-left: 0 !important;
            }
            #main-outlet {
                width: min(1120px, calc(100vw - 32px)) !important;
                max-width: none !important;
                margin: 0 auto !important;
                padding: 16px 0 24px !important;
            }
            .topic-list,
            .topic-list-body,
            .topic-post,
            .topic-body {
                max-width: 100% !important;
                box-sizing: border-box !important;
            }
        `;
    }

    function getQuickPreviewFrameCss(url, bg) {
        const previewSiteKey = resolveQuickPreviewSiteKey(url);
        const cssBuilderBySiteKey = {
            '2libra': get2LibraQuickPreviewFrameCss,
            'middlefun': getMiddlefunQuickPreviewFrameCss,
            'v2ex': getV2exQuickPreviewFrameCss,
            'linuxdo': getLinuxDoQuickPreviewFrameCss
        };
        const cssBuilder = cssBuilderBySiteKey[previewSiteKey] || cssBuilderBySiteKey['2libra'];
        return cssBuilder(bg);
    }

    function get2LibraNotificationsFrameCss(bg) {
        return `
            header, .navbar, aside, [role="banner"], [role="contentinfo"] { display: none !important; }
            .container { width: 100% !important; max-width: none !important; padding: 10px !important; }
            main { margin-top: 0 !important; }
            body { background: ${bg} !important; overflow-y: auto !important; }
            [data-right-sidebar="true"] { display: none !important; }
            .breadcrumbs { display: none !important; }
            .footer-horizontal { display: none !important; }
        `;
    }

    // 更新标题链接样式和行为
    function updateTitleLinkStyle(titleLink, settingKey = 'clickTitleQuickView') {
        if (!titleLink) return;

        const resolvedSettingKey = getTitleQuickViewSettingKeyForUrl(titleLink.href, settingKey);
        const isEnabled = Boolean(Settings[resolvedSettingKey]);

        if (isEnabled) {
            titleLink.classList.add('forummate-title-link-quick-view');
            titleLink.title = '点击快速查看';

            if (!titleLink.dataset.forummateClickAdded) {
                titleLink.dataset.forummateClickAdded = 'true';
                titleLink.addEventListener('click', (e) => {
                    if (!Settings[resolvedSettingKey]) return;
                    if (e.ctrlKey || e.metaKey) return;

                    e.preventDefault();
                    e.stopPropagation();
                    openModal(titleLink.href, titleLink.textContent);
                });
            }
        } else {
            titleLink.classList.remove('forummate-title-link-quick-view');
            if (titleLink.title === '点击快速查看') {
                titleLink.title = '';
            }
        }
    }

    // 主逻辑：尝试为单个 LI 元素添加按钮
function removeListItemQuickButton(li) {
        const existingBtn = li ? li.querySelector('.forummate-quick-btn') : null;
        if (existingBtn) {
            existingBtn.remove();
        }
    }

    // Main list-item processing entry
    function processListItem(li) {
        if (!li) return;

        const currentSiteConfig = getCurrentSiteConfig();
        const supportsQuickButton = Boolean(currentSiteConfig && currentSiteConfig.features && currentSiteConfig.features.listQuickButtonEnabled);
        if (!supportsQuickButton) {
            removeListItemQuickButton(li);
            return;
        }

        const quickViewSettingKey = currentSiteConfig && currentSiteConfig.settings
            ? currentSiteConfig.settings.titleQuickView
            : 'clickTitleQuickView';

        // Skip button injection when click-to-preview is enabled
        if (Boolean(Settings[quickViewSettingKey])) {
            // Remove any existing quick-view button to keep the UI consistent
            removeListItemQuickButton(li);
            return;
        }

        // Find the timestamp element in the current row
        const timeEl = li.querySelector('time');
        if (!timeEl) return;

        // Find the topic title link
        const titleLink = timeEl.parentElement.parentElement.querySelector('a.link');
        if (!titleLink || titleLink.tagName !== 'A') return;

        // Find the metadata row below the title
        const metaRow = timeEl.closest('.flex.items-center.gap-2');
        if (!metaRow) return;

        // Mark processed items so hover styles can target them
        if (!li.classList.contains('forummate-post-item')) {
            li.classList.add('forummate-post-item');
        }

        let btn = li.querySelector('.forummate-quick-btn');
        // Create the quick-view button only once
        if (!btn) {
            // Ensure the parent creates a positioning context
            if (getComputedStyle(metaRow.parentElement).position === 'static') {
                metaRow.parentElement.style.position = 'relative';
            }

            btn = document.createElement('button');
            btn.className = 'forummate-quick-btn';
            btn.textContent = CONFIG.btnText;
            btn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                openModal(titleLink.href, titleLink.textContent);
            };
            // Append the button next to the metadata row
            metaRow.parentElement.appendChild(btn);

            li.dataset.forummateQuickBtnAdded = 'true';
        }

        // Measure the rendered content width to place the button correctly
        const children = Array.from(metaRow.children).filter(c => getComputedStyle(c).display !== 'none');
        let contentRightEdge = 0;
        if (children.length > 0) {
            // Use the right-most visible child as the anchor edge
            children.forEach(child => {
                const right = child.offsetLeft + child.offsetWidth;
                if (right > contentRightEdge) contentRightEdge = right;
            });
        } else {
            contentRightEdge = metaRow.offsetWidth;
        }

        // Align the button to the right edge of the metadata content
        const leftPos = metaRow.offsetLeft + contentRightEdge + 8;
        btn.style.left = `${leftPos}px`;

        // Vertically center the button against the metadata row
        const topPos = metaRow.offsetTop + (metaRow.offsetHeight / 2);
        btn.style.top = `${topPos}px`;
    }

    // Strategy 1: lazy processing on mouseover
    document.body.addEventListener('mouseover', (e) => {
        if (!isCurrentSiteFeatureEnabled('lazyListItemProcessing')) return;

        const li = e.target.closest('li');
        if (li) {
            processListItem(li);
        }
    }, { passive: true });

    // --- Back-to-top button logic ---
    const BACK_TO_TOP_LABEL_BY_SETTING_KEY = SITE_CONFIG_LIST.reduce((labelBySettingKey, siteConfig) => {
        const settingKey = siteConfig.settings ? siteConfig.settings.backToTop : '';
        if (settingKey) {
            labelBySettingKey[settingKey] = `${siteConfig.displayName} 返回顶部按钮`;
        }
        return labelBySettingKey;
    }, {});

    const QUICK_VIEW_WIDTH_LABEL_BY_SETTING_KEY = SITE_CONFIG_LIST.reduce((labelBySettingKey, siteConfig) => {
        const settingKey = siteConfig.settings ? siteConfig.settings.modalWidth : '';
        if (settingKey) {
            labelBySettingKey[settingKey] = `${siteConfig.displayName} 弹窗宽度`;
        }
        return labelBySettingKey;
    }, {});
    function getCurrentBackToTopSettingKey() {
        const currentSiteConfig = getCurrentSiteConfig() || getSiteConfigByKey(DEFAULT_SITE_KEY);
        return currentSiteConfig && currentSiteConfig.settings ? currentSiteConfig.settings.backToTop : '';
    }

    function isBackToTopButtonEnabledForCurrentSite() {
        const settingKey = getCurrentBackToTopSettingKey();
        if (!settingKey) return false;

        if (Settings && typeof Settings[settingKey] === 'boolean') {
            return Settings[settingKey];
        }

        const currentSiteConfig = getCurrentSiteConfig() || getSiteConfigByKey(DEFAULT_SITE_KEY);
        const defaultValue = currentSiteConfig && currentSiteConfig.defaults
            ? Boolean(currentSiteConfig.defaults.backToTopEnabled)
            : true;
        return Boolean(GM_getValue(settingKey, defaultValue));
    }

    // 1. Create the button and mount it once
    const topButton = document.createElement('button');
    topButton.id = 'custom-back-to-top';
    topButton.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 19V5M12 5L5 12M12 5L19 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    `;
    document.body.appendChild(topButton);

    function hideTopButtonImmediately() {
        topButton.classList.remove('visible');
        topButton.style.display = 'none';
    }

    // 2. Bind the scroll-to-top action
    topButton.addEventListener('click', () => {
        if (!isBackToTopButtonEnabledForCurrentSite()) return;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    function queryFirstVisibleElement(selectors = []) {
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                return element;
            }
        }
        return null;
    }

    function getTallestCardElement() {
        const cardCandidates = Array.from(document.querySelectorAll('ul.card'));
        if (!cardCandidates.length) {
            return null;
        }
        return cardCandidates.reduce((maxCard, currentCard) => {
            return currentCard.getBoundingClientRect().height > maxCard.getBoundingClientRect().height
                ? currentCard
                : maxCard;
        });
    }
    function isScrollableElement(element) {
        if (!element || element === document.body || element === document.documentElement) {
            return false;
        }

        const computedStyle = window.getComputedStyle(element);
        const overflowY = computedStyle ? computedStyle.overflowY : '';
        const supportsScroll = overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay';
        return supportsScroll && element.scrollHeight > element.clientHeight;
    }

    function getScrollableAncestorScrollTop(element) {
        let currentElement = element;
        while (currentElement && currentElement !== document.body && currentElement !== document.documentElement) {
            if (isScrollableElement(currentElement) && typeof currentElement.scrollTop === 'number') {
                return currentElement.scrollTop;
            }
            currentElement = currentElement.parentElement;
        }
        return 0;
    }

    function getCurrentPageScrollTop(anchorElement) {
        const baseScrollTop = Math.max(
            window.scrollY || 0,
            document.documentElement ? document.documentElement.scrollTop : 0,
            document.body ? document.body.scrollTop : 0,
            document.scrollingElement ? document.scrollingElement.scrollTop : 0,
            lastScrollSource && typeof lastScrollSource.scrollTop === 'number' ? lastScrollSource.scrollTop : 0
        );

        const anchorScrollTop = anchorElement && typeof anchorElement.scrollTop === 'number'
            ? anchorElement.scrollTop
            : 0;
        const anchorAncestorScrollTop = getScrollableAncestorScrollTop(anchorElement);

        return Math.max(baseScrollTop, anchorScrollTop, anchorAncestorScrollTop);
    }

    // 3. Keep the button positioned and visible when needed
    function getTopButtonAnchorElement() {
        const currentSiteConfig = getCurrentSiteConfig() || getSiteConfigByKey(DEFAULT_SITE_KEY);
        const anchorSelectors = currentSiteConfig && currentSiteConfig.selectors
            ? currentSiteConfig.selectors.backToTopAnchors
            : [];

        const primaryAnchor = queryFirstVisibleElement(anchorSelectors);
        if (primaryAnchor) return primaryAnchor;

        const allowTallestCardFallback = Boolean(
            currentSiteConfig
            && currentSiteConfig.features
            && currentSiteConfig.features.backToTopUseTallestCardFallback
        );

        if (allowTallestCardFallback) {
            return getTallestCardElement();
        }

        return null;
    }

    function updateTopButtonPosition() {
        if (!isBackToTopButtonEnabledForCurrentSite()) {
            hideTopButtonImmediately();
            return;
        }

        const anchorElement = getTopButtonAnchorElement();
        const pageScrollTop = getCurrentPageScrollTop(anchorElement);
        const isScrolledDown = pageScrollTop > 100;

        if (!isScrolledDown) {
            if (topButton.classList.contains('visible')) {
                topButton.classList.remove('visible');
                setTimeout(() => {
                    if (!topButton.classList.contains('visible')) topButton.style.display = 'none';
                }, 300);
            }
            return;
        }

        topButton.style.display = 'flex';
        requestAnimationFrame(() => {
            topButton.classList.add('visible');
        });

        // Prefer anchoring to the content column when there is enough room.
        if (anchorElement) {
            const anchorRect = anchorElement.getBoundingClientRect();
            const isAnchorUsable = anchorRect.width > 0 && anchorRect.height > 0;
            const requiredWidth = anchorRect.width + 60;
            const hasEnoughSpace = window.innerWidth >= requiredWidth;

            if (isAnchorUsable && hasEnoughSpace) {
                const maxLeft = Math.max(16, window.innerWidth - topButton.offsetWidth - 16);
                const desiredLeft = anchorRect.right + TOP_BUTTON_HORIZONTAL_OFFSET;
                topButton.style.left = `${Math.max(16, Math.min(desiredLeft, maxLeft))}px`;
                topButton.style.right = 'auto';

                const desiredBottomOffset = 24;
                const buttonHeight = topButton.offsetHeight;
                const fixedPos = window.innerHeight - buttonHeight - desiredBottomOffset;
                const stickyPos = anchorRect.bottom - buttonHeight;
                const anchoredTop = stickyPos > 0 ? Math.min(fixedPos, stickyPos) : fixedPos;

                topButton.style.top = `${Math.max(16, anchoredTop)}px`;
                topButton.style.bottom = 'auto';
                return;
            }
        }

        // Fallback: keep it visible at bottom-right on narrow layouts.
        topButton.style.left = 'auto';
        topButton.style.right = '24px';
        topButton.style.top = 'auto';
        topButton.style.bottom = '24px';
    }
    let lastScrollSource = null;
    let ticking = false;
    function throttledUpdater(event) {
        if (event && event.target && typeof event.target.scrollTop === 'number') {
            lastScrollSource = event.target;
        }

        if (!ticking) {
            window.requestAnimationFrame(() => {
                updateTopButtonPosition();
                ticking = false;
            });
            ticking = true;
        }
    }
    function refreshBackToTopButtonState() {
        if (!isBackToTopButtonEnabledForCurrentSite()) {
            hideTopButtonImmediately();
            return;
        }
        throttledUpdater();
    }

    window.addEventListener('scroll', throttledUpdater);
    document.addEventListener('scroll', throttledUpdater, true);
    window.addEventListener('resize', throttledUpdater);
    window.addEventListener('wheel', throttledUpdater, { passive: true });
    window.addEventListener('touchmove', throttledUpdater, { passive: true });
    document.addEventListener('keydown', throttledUpdater);
    setInterval(throttledUpdater, 800);
    setTimeout(refreshBackToTopButtonState, 500);

    // --- Loading animations ---

    // Random loading animations and matching copy
    const loadingAnimations = [
        {
            class: 'sk-chase',
            html: `
                <div class="sk-chase">
                    <div class="sk-chase-dot"></div>
                    <div class="sk-chase-dot"></div>
                    <div class="sk-chase-dot"></div>
                    <div class="sk-chase-dot"></div>
                    <div class="sk-chase-dot"></div>
                    <div class="sk-chase-dot"></div>
                </div>
            `
        },
        {
            class: 'sk-pulse',
            html: '<div class="sk-pulse"></div>'
        },
        {
            class: 'sk-ripple',
            html: '<div class="sk-ripple"></div>'
        },
        {
            class: 'sk-rotate',
            html: '<div class="sk-rotate"></div>'
        },
        {
            class: 'sk-bounce',
            html: '<div class="sk-bounce"></div>'
        },
        {
            class: 'sk-wave',
            html: '<div class="sk-wave"></div>'
        },
        {
            class: 'sk-cube-grid',
            html: `
                <div class="sk-cube-grid">
                    <div class="sk-cube"></div>
                    <div class="sk-cube"></div>
                    <div class="sk-cube"></div>
                    <div class="sk-cube"></div>
                    <div class="sk-cube"></div>
                    <div class="sk-cube"></div>
                    <div class="sk-cube"></div>
                    <div class="sk-cube"></div>
                    <div class="sk-cube"></div>
                </div>
            `
        }
    ];

    const loadingTexts = [
        '正在加载精彩内容...',
        '正在飞速加载中...',
        '正在准备精彩内容...',
        '正在组装像素魔法...',
        '正在穿越网络的海洋...',
        '正在召唤帖子的灵魂...',
        '正在加载宇宙的奥秘...',
        '正在点亮知识的火花...',
        '正在编织信息的网络...',
        '正在唤醒沉睡的数据...',
        '正在绘制数字的画卷...',
        '正在解码比特的秘密...',
        '正在搭建内容的桥梁...',
        '正在收集思维的碎片...'
    ];

    // Return one random loading animation and text
    function getRandomLoadingContent() {
        const animation = loadingAnimations[Math.floor(Math.random() * loadingAnimations.length)];
        const text = loadingTexts[Math.floor(Math.random() * loadingTexts.length)];
        return { animation, text };
    }

    // --- Notifications quick-view modal ---
    const NOTIFICATIONS_MODAL_ID = 'notifications-modal';

    function createNotificationsModal() {
        if (document.getElementById(NOTIFICATIONS_MODAL_ID)) return;

        const modal = document.createElement('div');
        modal.id = NOTIFICATIONS_MODAL_ID;
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <span class="modal-title">快速查看</span>
                    <div class="modal-actions">
                        <button class="btn-back-notifications">返回通知</button>
                        <button class="btn-close">关闭</button>
                    </div>
                </div>
                <div class="forummate-modal-loading" id="notifications-modal-loading"></div>
                <iframe src=""></iframe>
            </div>
        `;

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeNotificationsModal();
            }
        });
        modal.querySelector('.btn-close').addEventListener('click', closeNotificationsModal);
        
        // Bind the return-to-notifications action
        modal.querySelector('.btn-back-notifications').addEventListener('click', () => {
             const iframe = modal.querySelector('iframe');
             iframe.src = '/notifications';
        });

        document.body.appendChild(modal);
    }

    function openNotificationsModal(url) {
        createNotificationsModal();
        const modal = document.getElementById(NOTIFICATIONS_MODAL_ID);

        let bg = window.getComputedStyle(document.body).backgroundColor;
        if (bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') {
            bg = window.getComputedStyle(document.documentElement).backgroundColor;
        }
        modal.style.setProperty('--forummate-dynamic-bg', bg);

        const iframe = modal.querySelector('iframe');
        const loading = modal.querySelector('#notifications-modal-loading');

        iframe.style.background = bg;
        iframe.style.opacity = '0';
        unbindEscapeKeyForIframe(iframe);

        // Show a random loading animation
        const { animation, text } = getRandomLoadingContent();
        loading.innerHTML = `
            <div class="loading-content">
                ${animation.html}
                <p class="loading-text">${text}</p>
            </div>
        `;
        loading.style.display = 'flex';

        iframe.src = url;

        modal.classList.add('active');
        syncBodyScrollLock();

        iframe.onload = () => {
            bindEscapeKeyForIframe(iframe, closeNotificationsModal);
            try {
                const doc = iframe.contentDocument;
                const css = get2LibraNotificationsFrameCss(bg);
                const style = doc.createElement('style');
                style.textContent = css;
                doc.head.appendChild(style);

                // Keep hiding the work-node list even after dynamic updates
                const hideWorkNodeList = () => {
                    const workNodeList = doc.querySelector('[role="work node list"]');
                    if (workNodeList && workNodeList.parentElement && workNodeList.parentElement.parentElement) {
                        const target = workNodeList.parentElement.parentElement;
                        if (target.style.display !== 'none') {
                            target.style.display = 'none';
                        }
                    }
                };

                // Run once immediately
                hideWorkNodeList();

                // Continue watching DOM changes
                const observer = new MutationObserver(hideWorkNodeList);
                observer.observe(doc.body, { childList: true, subtree: true });

                // Reveal the iframe after loading finishes
                iframe.style.opacity = '1';
                loading.style.display = 'none';
            } catch (e) {
                iframe.style.opacity = '1';
                loading.style.display = 'none';
            }
        };
    }

    function closeNotificationsModal() {
        const modal = document.getElementById(NOTIFICATIONS_MODAL_ID);
        if (modal) {
            modal.classList.remove('active');
            const iframe = modal.querySelector('iframe');
            unbindEscapeKeyForIframe(iframe);
            iframe.src = '';
            syncBodyScrollLock();
        }
    }


    // --- Settings ---
    const DEFAULT_SETTINGS = {
        clickTitleQuickView: true,
        quickViewModalWidth: '60',
        middlefunClickTitleQuickView: true,
        middlefunQuickViewModalWidth: '60',
        showQuickViewToast: true,
        v2exClickTitleQuickView: true,
        v2exQuickViewModalWidth: '60',
        linuxdoClickTitleQuickView: true,
        linuxdoQuickViewModalWidth: '60',
        showBackToTopButton: true,
        middlefunShowBackToTopButton: true,
        v2exShowBackToTopButton: true,
        linuxdoShowBackToTopButton: true,
        v2exChannelFilterEnabled: false,
        v2exBlockedChannels: '',
        v2exTitleKeywords: '',
        v2exFilterRelation: 'and'
    };

    function syncBodyScrollLock() {
        const activeModalIds = [CONFIG.modalId, NOTIFICATIONS_MODAL_ID, CONFIG.settingsModalId];
        const hasActiveModal = activeModalIds.some(id => {
            const element = document.getElementById(id);
            return element && element.classList.contains('active');
        });
        document.body.style.overflow = hasActiveModal ? 'hidden' : '';
    }

    function showToast(message, type = 'info') {
        const existingToast = document.querySelector('.forummate-toast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = `forummate-toast ${type}`;
        toast.textContent = message;

        document.body.appendChild(toast);
        toast.offsetHeight;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 300);
        }, 3000);
    }

    function normalizeSettingValue(key, value) {
        if (typeof DEFAULT_SETTINGS[key] === 'boolean') {
            return Boolean(value);
        }
        if (isQuickViewModalWidthSettingKey(key)) {
            return String(normalizeModalWidthPercent(value, DEFAULT_MODAL_WIDTH_PERCENT));
        }
        return String(value ?? '').trim();
    }

    function parseFilterValues(value) {
        return String(value ?? '')
            .split(/[\n,，]+/)
            .map(item => item.trim().toLowerCase())
            .filter(Boolean);
    }

    function handleClickTitleQuickViewChange(enabled, options = {}) {
        if (!options.silent) {
            const message = enabled ? '✅ 已启用：2libra 点击帖子标题快速查看' : '⬜ 已禁用：2libra 点击帖子标题快速查看';
            showToast(message, enabled ? 'success' : 'info');
        }
        processAllPostItems();
        syncSettingsModalState();
    }

    function handleMiddlefunClickTitleQuickViewChange(enabled, options = {}) {
        if (!options.silent) {
            const message = enabled ? '✅ 已启用：middlefun 点击帖子标题快速查看' : '⬜ 已禁用：middlefun 点击帖子标题快速查看';
            showToast(message, enabled ? 'success' : 'info');
        }
        processAllPostItems();
        syncSettingsModalState();
    }

    function handleShowQuickViewToastChange(enabled, options = {}) {
        if (!options.silent) {
            const message = enabled ? '✅ 已启用：通知快速查看' : '⬜ 已禁用：通知快速查看';
            showToast(message, enabled ? 'success' : 'info');
        }
        updateNotificationLinkState();
        syncSettingsModalState();
    }

    function handleV2exClickTitleQuickViewChange(enabled, options = {}) {
        if (!options.silent) {
            const message = enabled ? '✅ 已启用：V2EX 点击帖子标题快速查看' : '⬜ 已禁用：V2EX 点击帖子标题快速查看';
            showToast(message, enabled ? 'success' : 'info');
        }
        processAllPostItems();
        syncSettingsModalState();
    }

    function handleLinuxDoClickTitleQuickViewChange(enabled, options = {}) {
        if (!options.silent) {
            const message = enabled ? '✅ 已启用：linux.do 点击帖子标题快速查看' : '⬜ 已禁用：linux.do 点击帖子标题快速查看';
            showToast(message, enabled ? 'success' : 'info');
        }
        processAllPostItems();
        syncSettingsModalState();
    }
    function handleQuickViewModalWidthSettingChange(key, value, options = {}) {
        const widthPercent = normalizeModalWidthPercent(value, DEFAULT_MODAL_WIDTH_PERCENT);
        if (!options.silent) {
            const settingLabel = QUICK_VIEW_WIDTH_LABEL_BY_SETTING_KEY[key] || '弹窗宽度';
            showToast(`✅ 已更新：${settingLabel} ${widthPercent}%`, 'success');
        }
        refreshActiveQuickViewModalWidth();
        syncSettingsModalState();
    }
    function handleBackToTopButtonSettingChange(key, enabled, options = {}) {
        if (!options.silent) {
            const settingLabel = BACK_TO_TOP_LABEL_BY_SETTING_KEY[key] || '返回顶部按钮';
            const message = enabled ? `✅ 已启用：${settingLabel}` : `⬜ 已禁用：${settingLabel}`;
            showToast(message, enabled ? 'success' : 'info');
        }
        refreshBackToTopButtonState();
        syncSettingsModalState();
    }
    function handleV2exSettingsChange(options = {}) {
        if (!options.silent) {
            showToast('✅ 已更新：V2EX 频道屏蔽设置', 'success');
        }
        processAllPostItems();
        syncSettingsModalState();
    }

    const SETTING_CHANGE_HANDLERS = (() => {
        const handlers = {
            clickTitleQuickView: handleClickTitleQuickViewChange,
            middlefunClickTitleQuickView: handleMiddlefunClickTitleQuickViewChange,
            showQuickViewToast: handleShowQuickViewToastChange,
            v2exClickTitleQuickView: handleV2exClickTitleQuickViewChange,
            linuxdoClickTitleQuickView: handleLinuxDoClickTitleQuickViewChange,
            v2exChannelFilterEnabled: (_value, options = {}) => handleV2exSettingsChange(options),
            v2exBlockedChannels: (_value, options = {}) => handleV2exSettingsChange(options),
            v2exTitleKeywords: (_value, options = {}) => handleV2exSettingsChange(options),
            v2exFilterRelation: (_value, options = {}) => handleV2exSettingsChange(options)
        };

        SITE_CONFIG_LIST.forEach(siteConfig => {
            const backToTopSettingKey = siteConfig.settings ? siteConfig.settings.backToTop : '';
            if (backToTopSettingKey) {
                handlers[backToTopSettingKey] = (enabled, options = {}) => {
                    handleBackToTopButtonSettingChange(backToTopSettingKey, enabled, options);
                };
            }

            const modalWidthSettingKey = siteConfig.settings ? siteConfig.settings.modalWidth : '';
            if (modalWidthSettingKey) {
                handlers[modalWidthSettingKey] = (value, options = {}) => {
                    handleQuickViewModalWidthSettingChange(modalWidthSettingKey, value, options);
                };
            }
        });

        return Object.freeze(handlers);
    })();

    function updateSetting(key, value, options = {}) {
        const normalizedValue = normalizeSettingValue(key, value);
        const currentValue = normalizeSettingValue(key, GM_getValue(key, DEFAULT_SETTINGS[key]));

        if (currentValue === normalizedValue && !options.forceHandlers) {
            syncSettingsModalState();
            return;
        }

        GM_setValue(key, normalizedValue);

        const changeHandler = SETTING_CHANGE_HANDLERS[key];
        if (typeof changeHandler === 'function') {
            changeHandler(normalizedValue, options);
        }
    }

    Settings = {
        get clickTitleQuickView() {
            return Boolean(GM_getValue('clickTitleQuickView', DEFAULT_SETTINGS.clickTitleQuickView));
        },
        set clickTitleQuickView(value) {
            updateSetting('clickTitleQuickView', value);
        },
        get quickViewModalWidth() {
            return String(normalizeModalWidthPercent(GM_getValue('quickViewModalWidth', DEFAULT_SETTINGS.quickViewModalWidth), DEFAULT_MODAL_WIDTH_PERCENT));
        },
        set quickViewModalWidth(value) {
            updateSetting('quickViewModalWidth', value);
        },
        get middlefunClickTitleQuickView() {
            return Boolean(GM_getValue('middlefunClickTitleQuickView', DEFAULT_SETTINGS.middlefunClickTitleQuickView));
        },
        set middlefunClickTitleQuickView(value) {
            updateSetting('middlefunClickTitleQuickView', value);
        },
        get middlefunQuickViewModalWidth() {
            return String(normalizeModalWidthPercent(GM_getValue('middlefunQuickViewModalWidth', DEFAULT_SETTINGS.middlefunQuickViewModalWidth), DEFAULT_MODAL_WIDTH_PERCENT));
        },
        set middlefunQuickViewModalWidth(value) {
            updateSetting('middlefunQuickViewModalWidth', value);
        },
        get showQuickViewToast() {
            return Boolean(GM_getValue('showQuickViewToast', DEFAULT_SETTINGS.showQuickViewToast));
        },
        set showQuickViewToast(value) {
            updateSetting('showQuickViewToast', value);
        },
        get v2exClickTitleQuickView() {
            return Boolean(GM_getValue('v2exClickTitleQuickView', DEFAULT_SETTINGS.v2exClickTitleQuickView));
        },
        set v2exClickTitleQuickView(value) {
            updateSetting('v2exClickTitleQuickView', value);
        },
        get v2exQuickViewModalWidth() {
            return String(normalizeModalWidthPercent(GM_getValue('v2exQuickViewModalWidth', DEFAULT_SETTINGS.v2exQuickViewModalWidth), DEFAULT_MODAL_WIDTH_PERCENT));
        },
        set v2exQuickViewModalWidth(value) {
            updateSetting('v2exQuickViewModalWidth', value);
        },
        get linuxdoClickTitleQuickView() {
            return Boolean(GM_getValue('linuxdoClickTitleQuickView', DEFAULT_SETTINGS.linuxdoClickTitleQuickView));
        },
        set linuxdoClickTitleQuickView(value) {
            updateSetting('linuxdoClickTitleQuickView', value);
        },
        get linuxdoQuickViewModalWidth() {
            return String(normalizeModalWidthPercent(GM_getValue('linuxdoQuickViewModalWidth', DEFAULT_SETTINGS.linuxdoQuickViewModalWidth), DEFAULT_MODAL_WIDTH_PERCENT));
        },
        set linuxdoQuickViewModalWidth(value) {
            updateSetting('linuxdoQuickViewModalWidth', value);
        },
        get showBackToTopButton() {
            return Boolean(GM_getValue('showBackToTopButton', DEFAULT_SETTINGS.showBackToTopButton));
        },
        set showBackToTopButton(value) {
            updateSetting('showBackToTopButton', value);
        },
        get middlefunShowBackToTopButton() {
            return Boolean(GM_getValue('middlefunShowBackToTopButton', DEFAULT_SETTINGS.middlefunShowBackToTopButton));
        },
        set middlefunShowBackToTopButton(value) {
            updateSetting('middlefunShowBackToTopButton', value);
        },
        get v2exShowBackToTopButton() {
            return Boolean(GM_getValue('v2exShowBackToTopButton', DEFAULT_SETTINGS.v2exShowBackToTopButton));
        },
        set v2exShowBackToTopButton(value) {
            updateSetting('v2exShowBackToTopButton', value);
        },
        get linuxdoShowBackToTopButton() {
            return Boolean(GM_getValue('linuxdoShowBackToTopButton', DEFAULT_SETTINGS.linuxdoShowBackToTopButton));
        },
        set linuxdoShowBackToTopButton(value) {
            updateSetting('linuxdoShowBackToTopButton', value);
        },
        get v2exChannelFilterEnabled() {
            return Boolean(GM_getValue('v2exChannelFilterEnabled', DEFAULT_SETTINGS.v2exChannelFilterEnabled));
        },
        set v2exChannelFilterEnabled(value) {
            updateSetting('v2exChannelFilterEnabled', value);
        },
        get v2exBlockedChannels() {
            return String(GM_getValue('v2exBlockedChannels', DEFAULT_SETTINGS.v2exBlockedChannels));
        },
        set v2exBlockedChannels(value) {
            updateSetting('v2exBlockedChannels', value);
        },
        get v2exTitleKeywords() {
            return String(GM_getValue('v2exTitleKeywords', DEFAULT_SETTINGS.v2exTitleKeywords));
        },
        set v2exTitleKeywords(value) {
            updateSetting('v2exTitleKeywords', value);
        },
        get v2exFilterRelation() {
            const value = String(GM_getValue('v2exFilterRelation', DEFAULT_SETTINGS.v2exFilterRelation));
            return value === 'or' ? 'or' : 'and';
        },
        set v2exFilterRelation(value) {
            updateSetting('v2exFilterRelation', value === 'or' ? 'or' : 'and');
        }
    };

    function syncSettingsModalState() {
        const modal = document.getElementById(CONFIG.settingsModalId);
        if (!modal) return;

        modal.querySelectorAll('[data-setting]').forEach(control => {
            const key = control.dataset.setting;
            const value = Settings[key];
            if (control.type === 'checkbox') {
                control.checked = Boolean(value);
            } else {
                control.value = String(value ?? '');
            }
        });
    }

    function setSettingsGroupExpanded(groupElement, expanded) {
        groupElement.classList.toggle('is-collapsed', !expanded);
        const toggleButton = groupElement.querySelector('[data-group-toggle]');
        if (toggleButton) {
            toggleButton.setAttribute('aria-expanded', expanded ? 'true' : 'false');
        }
    }

    function setAllSettingsGroupsExpanded(modal, expanded) {
        modal.querySelectorAll('.settings-group[data-site-group]').forEach(groupElement => {
            setSettingsGroupExpanded(groupElement, expanded);
        });
    }

    function resetSettingsGroupsForCurrentSite(modal) {
        const currentSiteKey = getCurrentSiteKey();
        modal.querySelectorAll('.settings-group[data-site-group]').forEach(groupElement => {
            const groupSiteKey = groupElement.dataset.siteGroup;
            setSettingsGroupExpanded(groupElement, groupSiteKey === currentSiteKey);
        });
    }

    function createSettingsModal() {
        if (document.getElementById(CONFIG.settingsModalId)) return;

        const modal = document.createElement('div');
        modal.id = CONFIG.settingsModalId;
        modal.innerHTML = `
            <div class="settings-panel">
                <div class="settings-header">
                    <div>
                        <div class="settings-title">ForumMate 设置</div>
                        <div class="settings-subtitle">修改后立即生效</div>
                    </div>
                    <button class="btn-close-settings" type="button">完成</button>
                </div>
                <div class="settings-body">
                    <div class="settings-actions">
                        <button class="btn-settings-action" type="button" data-settings-action="expand-all">展开全部</button>
                        <button class="btn-settings-action" type="button" data-settings-action="collapse-all">收起全部</button>
                    </div>
                    <section class="settings-group" data-site-group="2libra">
                        <button class="settings-group-toggle" type="button" data-group-toggle="2libra" aria-expanded="false">
                            <span class="settings-group-title">2libra.com</span>
                            <span class="settings-group-chevron">▾</span>
                        </button>
                        <div class="settings-group-list">
                            <label class="settings-item">
                                <div class="settings-copy">
                                    <span class="settings-name">点击帖子标题快速查看</span>
                                    <span class="settings-description">开启后点击标题直接弹出预览；关闭后恢复为右侧“快速查看”按钮。</span>
                                </div>
                                <span class="settings-switch">
                                    <input type="checkbox" data-setting="clickTitleQuickView">
                                    <span class="settings-slider"></span>
                                </span>
                            </label>
                            <label class="settings-item">
                                <div class="settings-copy">
                                    <span class="settings-name">预览弹窗宽度</span>
                                    <span class="settings-description">预览弹窗宽度</span>
                                </div>
                                <select class="settings-input" data-setting="quickViewModalWidth" style="width: 90px; flex: 0 0 90px;">
                                    <option value="60">60%</option>
                                    <option value="70">70%</option>
                                    <option value="80">80%</option>
                                    <option value="90">90%</option>
                                </select>
                            </label>
                            <label class="settings-item">
                                <div class="settings-copy">
                                    <span class="settings-name">通知快速查看</span>
                                    <span class="settings-description">开启后点击通知入口会在弹框内查看；关闭后按论坛默认方式打开通知页。</span>
                                </div>
                                <span class="settings-switch">
                                    <input type="checkbox" data-setting="showQuickViewToast">
                                    <span class="settings-slider"></span>
                                </span>
                            </label>
                            <label class="settings-item">
                                <div class="settings-copy">
                                    <span class="settings-name">返回顶部按钮</span>
                                    <span class="settings-description">开启后滚动页面会在右下方显示返回顶部按钮；关闭后不再显示。</span>
                                </div>
                                <span class="settings-switch">
                                    <input type="checkbox" data-setting="showBackToTopButton">
                                    <span class="settings-slider"></span>
                                </span>
                            </label>
                        </div>
                    </section>
                    <section class="settings-group" data-site-group="middlefun">
                        <button class="settings-group-toggle" type="button" data-group-toggle="middlefun" aria-expanded="false">
                            <span class="settings-group-title">middlefun.com</span>
                            <span class="settings-group-chevron">▾</span>
                        </button>
                        <div class="settings-group-list">
                            <label class="settings-item">
                                <div class="settings-copy">
                                    <span class="settings-name">点击帖子标题快速查看</span>
                                    <span class="settings-description">开启后点击标题直接弹出预览</span>
                                </div>
                                <span class="settings-switch">
                                    <input type="checkbox" data-setting="middlefunClickTitleQuickView">
                                    <span class="settings-slider"></span>
                                </span>
                            </label>
                            <label class="settings-item">
                                <div class="settings-copy">
                                    <span class="settings-name">预览弹窗宽度</span>
                                    <span class="settings-description">预览弹窗宽度</span>
                                </div>
                                <select class="settings-input" data-setting="middlefunQuickViewModalWidth" style="width: 90px; flex: 0 0 90px;">
                                    <option value="60">60%</option>
                                    <option value="70">70%</option>
                                    <option value="80">80%</option>
                                    <option value="90">90%</option>
                                </select>
                            </label>
                            <label class="settings-item">
                                <div class="settings-copy">
                                    <span class="settings-name">返回顶部按钮</span>
                                    <span class="settings-description">开启后滚动页面会显示返回顶部按钮；关闭后不再显示。</span>
                                </div>
                                <span class="settings-switch">
                                    <input type="checkbox" data-setting="middlefunShowBackToTopButton">
                                    <span class="settings-slider"></span>
                                </span>
                            </label>
                        </div>
                    </section>
                    <section class="settings-group" data-site-group="v2ex">
                        <button class="settings-group-toggle" type="button" data-group-toggle="v2ex" aria-expanded="false">
                            <span class="settings-group-title">v2ex.com</span>
                            <span class="settings-group-chevron">▾</span>
                        </button>
                        <div class="settings-group-list">
                            <label class="settings-item">
                                <div class="settings-copy">
                                    <span class="settings-name">点击帖子标题快速查看</span>
                                    <span class="settings-description">开启后点击标题直接弹出预览</span>
                                </div>
                                <span class="settings-switch">
                                    <input type="checkbox" data-setting="v2exClickTitleQuickView">
                                    <span class="settings-slider"></span>
                                </span>
                            </label>
                            <label class="settings-item">
                                <div class="settings-copy">
                                    <span class="settings-name">预览弹窗宽度</span>
                                    <span class="settings-description">预览弹窗宽度</span>
                                </div>
                                <select class="settings-input" data-setting="v2exQuickViewModalWidth" style="width: 90px; flex: 0 0 90px;">
                                    <option value="60">60%</option>
                                    <option value="70">70%</option>
                                    <option value="80">80%</option>
                                    <option value="90">90%</option>
                                </select>
                            </label>
                            <label class="settings-item">
                                <div class="settings-copy">
                                    <span class="settings-name">返回顶部按钮</span>
                                    <span class="settings-description">开启后滚动页面会显示返回顶部按钮；关闭后不再显示。</span>
                                </div>
                                <span class="settings-switch">
                                    <input type="checkbox" data-setting="v2exShowBackToTopButton">
                                    <span class="settings-slider"></span>
                                </span>
                            </label>
                            <label class="settings-item">
                                <div class="settings-copy">
                                    <span class="settings-name">屏蔽指定频道帖子</span>
                                    <span class="settings-description">开启后按下面的子规则隐藏 V2EX 列表项</span>
                                </div>
                                <span class="settings-switch">
                                    <input type="checkbox" data-setting="v2exChannelFilterEnabled">
                                    <span class="settings-slider"></span>
                                </span>
                            </label>
                            <div class="settings-subgroup">
                                <div class="settings-item-stack">
                                    <div class="settings-copy">
                                        <span class="settings-name">屏蔽频道</span>
                                        <span class="settings-description">子规则 1。支持中文频道名或英文 slug，多个可用逗号、中文逗号或换行分隔，例如：推广、promotions。</span>
                                    </div>
                                    <textarea class="settings-textarea" data-setting="v2exBlockedChannels" placeholder="推广&#10;promotions"></textarea>
                                </div>
                                <div class="settings-item-stack">
                                    <div class="settings-copy">
                                        <span class="settings-name">标题关键字</span>
                                        <span class="settings-description">子规则 2。可单独生效；多个可用逗号、中文逗号或换行分隔。</span>
                                    </div>
                                    <input class="settings-input" type="text" data-setting="v2exTitleKeywords" placeholder="中转站, 送码">
                                </div>
                                <div class="settings-item-stack">
                                    <div class="settings-copy">
                                        <span class="settings-name">规则关系</span>
                                        <span class="settings-description">当“屏蔽频道”和“标题关键字”都填写时，选择同时满足（and）还是任一满足（or）。只填写其中一项时，该项会单独生效。</span>
                                    </div>
                                    <select class="settings-input" data-setting="v2exFilterRelation">
                                        <option value="and">屏蔽频道 and 标题关键字</option>
                                        <option value="or">屏蔽频道 or 标题关键字</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </section>
                    <section class="settings-group" data-site-group="linuxdo">
                        <button class="settings-group-toggle" type="button" data-group-toggle="linuxdo" aria-expanded="false">
                            <span class="settings-group-title">linux.do</span>
                            <span class="settings-group-chevron">▾</span>
                        </button>
                        <div class="settings-group-list">
                            <label class="settings-item">
                                <div class="settings-copy">
                                    <span class="settings-name">点击帖子标题快速查看</span>
                                    <span class="settings-description">开启后点击标题直接弹出预览</span>
                                </div>
                                <span class="settings-switch">
                                    <input type="checkbox" data-setting="linuxdoClickTitleQuickView">
                                    <span class="settings-slider"></span>
                                </span>
                            </label>
                            <label class="settings-item">
                                <div class="settings-copy">
                                    <span class="settings-name">预览弹窗宽度</span>
                                    <span class="settings-description">预览弹窗宽度</span>
                                </div>
                                <select class="settings-input" data-setting="linuxdoQuickViewModalWidth" style="width: 90px; flex: 0 0 90px;">
                                    <option value="60">60%</option>
                                    <option value="70">70%</option>
                                    <option value="80">80%</option>
                                    <option value="90">90%</option>
                                </select>
                            </label>
                            <label class="settings-item">
                                <div class="settings-copy">
                                    <span class="settings-name">返回顶部按钮</span>
                                    <span class="settings-description">开启后滚动页面会显示返回顶部按钮；关闭后不再显示。</span>
                                </div>
                                <span class="settings-switch">
                                    <input type="checkbox" data-setting="linuxdoShowBackToTopButton">
                                    <span class="settings-slider"></span>
                                </span>
                            </label>
                        </div>
                    </section>
                </div>
                <div class="settings-footer">
                    <div class="settings-footer-actions">
                        <button class="btn-feedback-settings" type="button">反馈</button>
                        <button class="btn-appreciation-settings" type="button">赞赏</button>
                    </div>
                </div>
            </div>
        `;

        modal.addEventListener('click', event => {
            if (event.target === modal) {
                closeSettingsModal();
            }
        });

        modal.querySelector('.btn-close-settings').addEventListener('click', closeSettingsModal);
        modal.querySelector('.btn-feedback-settings').addEventListener('click', () => {
            window.open(CONFIG.feedbackUrl, '_blank', 'noopener,noreferrer');
        });
        modal.querySelector('.btn-appreciation-settings').addEventListener('click', () => {
            window.open(CONFIG.appreciationUrl, '_blank', 'noopener,noreferrer');
        });

        modal.querySelectorAll('[data-group-toggle]').forEach(toggleButton => {
            toggleButton.addEventListener('click', event => {
                const currentButton = event.currentTarget;
                const groupSiteKey = currentButton.dataset.groupToggle;
                const groupElement = modal.querySelector('.settings-group[data-site-group="' + groupSiteKey + '"]');
                if (!groupElement) return;

                const isExpanded = currentButton.getAttribute('aria-expanded') === 'true';
                setSettingsGroupExpanded(groupElement, !isExpanded);
            });
        });

        const expandAllButton = modal.querySelector('[data-settings-action="expand-all"]');
        if (expandAllButton) {
            expandAllButton.addEventListener('click', () => {
                setAllSettingsGroupsExpanded(modal, true);
            });
        }

        const collapseAllButton = modal.querySelector('[data-settings-action="collapse-all"]');
        if (collapseAllButton) {
            collapseAllButton.addEventListener('click', () => {
                setAllSettingsGroupsExpanded(modal, false);
            });
        }

        modal.querySelectorAll('[data-setting]').forEach(control => {
            const isCheckbox = control.type === 'checkbox';
            const isSelect = control.tagName && control.tagName.toLowerCase() === 'select';
            const eventName = (isCheckbox || isSelect) ? 'change' : 'input';
            control.addEventListener(eventName, event => {
                const currentControl = event.currentTarget;
                const nextValue = currentControl.type === 'checkbox' ? currentControl.checked : currentControl.value;
                Settings[currentControl.dataset.setting] = nextValue;
            });
        });

        document.body.appendChild(modal);
        syncSettingsModalState();
    }


    function openSettingsModal() {
        createSettingsModal();
        const modal = document.getElementById(CONFIG.settingsModalId);
        const currentSiteConfig = getCurrentSiteConfig() || getSiteConfigByKey('2libra');

        let bg = window.getComputedStyle(document.body).backgroundColor;
        if (isTransparentColor(bg)) {
            bg = window.getComputedStyle(document.documentElement).backgroundColor;
        }

        const transparentBgFallback = currentSiteConfig && currentSiteConfig.styles
            ? currentSiteConfig.styles.transparentBgFallback
            : '';
        if (transparentBgFallback && isTransparentColor(bg)) {
            bg = transparentBgFallback;
        }

        modal.style.setProperty('--forummate-dynamic-bg', bg);
        modal.dataset.forummateSite = currentSiteConfig ? currentSiteConfig.key : '2libra';
        resetSettingsGroupsForCurrentSite(modal);
        syncSettingsModalState();
        modal.classList.add('active');
        syncBodyScrollLock();
    }

    function closeSettingsModal() {
        const modal = document.getElementById(CONFIG.settingsModalId);
        if (!modal) return;

        modal.classList.remove('active');
        syncBodyScrollLock();
    }

    function registerNativeSettingsMenu() {
        if (typeof GM_registerMenuCommand !== 'function') return;

        GM_registerMenuCommand('ForumMate 设置', () => {
            openSettingsModal();
        });
    }

    function handleGlobalEscapeKey(event) {
        if (event.key !== 'Escape') return;

        const settingsModal = document.getElementById(CONFIG.settingsModalId);
        if (settingsModal && settingsModal.classList.contains('active')) {
            event.preventDefault();
            event.stopPropagation();
            closeSettingsModal();
            return;
        }

        const notificationsModal = document.getElementById(NOTIFICATIONS_MODAL_ID);
        if (notificationsModal && notificationsModal.classList.contains('active')) {
            event.preventDefault();
            event.stopPropagation();
            closeNotificationsModal();
            return;
        }

        const quickViewModal = document.getElementById(CONFIG.modalId);
        if (quickViewModal && quickViewModal.classList.contains('active')) {
            event.preventDefault();
            event.stopPropagation();
            closeModal();
        }
    }
    document.addEventListener('keydown', handleGlobalEscapeKey, true);

    // 鍏ㄥ眬鎵弿骞跺鐞嗘墍鏈夊笘瀛愰」
    function process2LibraPostItems() {
        const postLinks = document.querySelectorAll('a.link.link-hover.leading-4');
        postLinks.forEach(postLink => {
            const li = postLink.closest('li');
            if (li) {
                processListItem(li);
            }
        });

        let postFlatLinks = document.querySelectorAll('a[href^="/post-flat"], a[href^="/posts/"], a[href*="://middlefun.com/posts/"]');
        if (!postFlatLinks || postFlatLinks.length === 0) {
            postFlatLinks = document.querySelectorAll('a[href^="/post/"]');
        }

        postFlatLinks.forEach(postLink => {
            if (postLink.classList.contains('join-item')) return;
            updateTitleLinkStyle(postLink);
        });
    }

    function getV2exTopicCell(topicLink) {
        const topicCell = topicLink.closest('.cell.item');
        return topicCell || null;
    }
    function getV2exChannelTokens(topicCell) {
        const channelLink = topicCell ? topicCell.querySelector('a[href^="/go/"], a[href^="https://v2ex.com/go/"], a[href^="https://www.v2ex.com/go/"]') : null;
        if (!channelLink) return [];
        const href = channelLink.getAttribute('href') || '';
        const match = href.match(/\/go\/([^/?#]+)/i);
        const tokens = [];
        const label = channelLink.textContent ? channelLink.textContent.trim().toLowerCase() : '';
        const slug = match ? match[1].trim().toLowerCase() : '';
        if (label) tokens.push(label);
        if (slug && !tokens.includes(slug)) tokens.push(slug);
        return tokens;
    }
    function shouldHideV2exTopic(topicLink) {
        if (!isCurrentSiteFeatureEnabled('v2exTopicFilter') || !Settings.v2exChannelFilterEnabled) return false;
        const topicCell = getV2exTopicCell(topicLink);
        if (!topicCell) return false;
        const blockedChannels = parseFilterValues(Settings.v2exBlockedChannels);
        const titleKeywords = parseFilterValues(Settings.v2exTitleKeywords);
        const hasChannelRule = blockedChannels.length > 0;
        const hasTitleRule = titleKeywords.length > 0;
        if (!hasChannelRule && !hasTitleRule) return false;

        let channelMatched = false;
        if (hasChannelRule) {
            const channelTokens = getV2exChannelTokens(topicCell);
            channelMatched = channelTokens.length ? blockedChannels.some(channel => channelTokens.includes(channel)) : false;
        }

        const titleText = (topicLink.textContent || '').trim().toLowerCase();
        const titleMatched = hasTitleRule ? titleKeywords.some(keyword => titleText.includes(keyword)) : false;

        if (hasChannelRule && hasTitleRule) {
            return Settings.v2exFilterRelation === 'or'
                ? (channelMatched || titleMatched)
                : (channelMatched && titleMatched);
        }

        return hasChannelRule ? channelMatched : titleMatched;
    }
    function applyV2exTopicVisibility(topicLink) {
        const topicCell = getV2exTopicCell(topicLink);
        if (!topicCell) return;
        topicCell.style.display = shouldHideV2exTopic(topicLink) ? 'none' : '';
    }
    function processV2exTopicLinks() {
        const topicLinks = document.querySelectorAll('.item_title a[href^="/t/"], .item_title a[href^="https://v2ex.com/t/"], .item_title a[href^="https://www.v2ex.com/t/"], a.topic-link[href^="/t/"], a.topic-link[href^="https://v2ex.com/t/"], a.topic-link[href^="https://www.v2ex.com/t/"]');
        topicLinks.forEach(topicLink => {
            if (!isV2exTopicUrl(topicLink.href)) return;
            updateTitleLinkStyle(topicLink);
            applyV2exTopicVisibility(topicLink);
        });
    }
    function processLinuxDoTopicLinks() {
        const topicLinks = document.querySelectorAll('.topic-list a[href^="/t/"], .topic-list a[href^="https://linux.do/t/"], .topic-list a[href^="https://www.linux.do/t/"], a.title.raw-link.raw-topic-link[href^="/t/"], a.title.raw-link.raw-topic-link[href^="https://linux.do/t/"], a.title.raw-link.raw-topic-link[href^="https://www.linux.do/t/"]');
        topicLinks.forEach(topicLink => {
            if (!isLinuxDoTopicUrl(topicLink.href)) return;
            updateTitleLinkStyle(topicLink);
        });
    }
    function processAllPostItems() {
        const processorBySiteKey = {
            '2libra': process2LibraPostItems,
            'middlefun': process2LibraPostItems,
            'v2ex': processV2exTopicLinks,
            'linuxdo': processLinuxDoTopicLinks
        };
        const processor = processorBySiteKey[getCurrentSiteKey()] || process2LibraPostItems;
        processor();
    }



    // --- Notification link initialization ---
    function updateNotificationLinkState() {
        const notificationLink = document.querySelector('a[href="/notifications"], a[href$="/notifications"]');
        if (notificationLink) {
            if (Settings.showQuickViewToast) {
                notificationLink.title = '点击快速查看通知';
                notificationLink.style.cursor = 'pointer';
            } else {
                notificationLink.title = '';
            }

            if (!notificationLink.dataset.notificationModalAdded) {
                notificationLink.dataset.notificationModalAdded = 'true';
                notificationLink.addEventListener('click', e => {
                    // Re-check the live setting so the toggle applies immediately
                    if (Settings.showQuickViewToast) {
                        // Respect Ctrl/Cmd-click and let the browser open a new tab
                        if (e.ctrlKey || e.metaKey) return; 
                        
                        e.preventDefault();
                        e.stopPropagation();
                        openNotificationsModal(notificationLink.href);
                    }
                });
            }
        }
    }

    function initializeNotificationQuickView() {
        if (!isCurrentSiteFeatureEnabled('notificationsQuickView')) return;

        // Initial pass
        updateNotificationLinkState();
        
        // Keep watching for SPA navigation and lazy-loaded notification links
        const observer = new MutationObserver(() => {
            updateNotificationLinkState();
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    // Run all initializers
    registerNativeSettingsMenu();
    createSettingsModal();
    initializeNotificationQuickView();

    // Initial pass for topic title quick preview
    processAllPostItems();

    // Keep observing newly inserted posts for SPA and lazy-loaded pages
    const postListObserver = new MutationObserver(() => {
        processAllPostItems();
    });
    postListObserver.observe(document.body, { childList: true, subtree: true });

})();































































