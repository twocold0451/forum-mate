// ==UserScript==
// @name         ForumMate 论坛增强助手
// @namespace    http://tampermonkey.net/
// @version      1.8.2
// @description  ForumMate 论坛增强助手：当前支持 2libra.com、middlefun.com、v2ex.com 的帖子快速查看与筛选
// @author       twocold0451
// @homepage     https://github.com/twocold0451/forum-mate
// @supportURL   https://github.com/twocold0451/forum-mate/issues
// @match        https://*.2libra.com/*
// @match        https://*.middlefun.com/*
// @match        https://*.v2ex.com/*
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

    function isDomainOrSubdomain(hostname, domain) {
        return hostname === domain || hostname.endsWith(`.${domain}`);
    }

    function is2LibraSite(hostname = window.location.hostname) {
        return isDomainOrSubdomain(hostname, '2libra.com');
    }

    function isMiddlefunSite(hostname = window.location.hostname) {
        return isDomainOrSubdomain(hostname, 'middlefun.com');
    }

    function is2LibraLikeSite(hostname = window.location.hostname) {
        return is2LibraSite(hostname) || isMiddlefunSite(hostname);
    }

    function isV2exSite(hostname = window.location.hostname) {
        return isDomainOrSubdomain(hostname, 'v2ex.com');
    }

    function getCurrentSiteKey(hostname = window.location.hostname) {
        if (isV2exSite(hostname)) return 'v2ex';
        if (isMiddlefunSite(hostname)) return 'middlefun';
        if (is2LibraSite(hostname)) return '2libra';
        return 'unknown';
    }

    const FORUMMATE_SITE_CLASS = 'forummate-site-' + getCurrentSiteKey();
    document.documentElement.classList.add(FORUMMATE_SITE_CLASS);

    const TOP_BUTTON_HORIZONTAL_OFFSET = 12;
    const BACK_TO_TOP_SETTING_KEY_BY_SITE = {
        '2libra': 'showBackToTopButton',
        'middlefun': 'middlefunShowBackToTopButton',
        'v2ex': 'v2exShowBackToTopButton'
    };
    const BACK_TO_TOP_SETTING_DEFAULTS = {
        showBackToTopButton: true,
        middlefunShowBackToTopButton: true,
        v2exShowBackToTopButton: true
    };

    function isEmbeddedFrame() {
        try {
            return window.self !== window.top;
        } catch (error) {
            return true;
        }
    }

    // 2libra-like quick preview uses a same-origin iframe; skip re-initializing inside it.
    if (is2LibraLikeSite() && isEmbeddedFrame()) {
        console.log('ForumMate Script: Skip initialization inside 2libra-like preview iframe.');
        return;
    }
    function isV2exTopicUrl(url) {
        try {
            const parsedUrl = new URL(url, window.location.href);
            return isV2exSite(parsedUrl.hostname) && /^\/t\/\d+$/.test(parsedUrl.pathname);
        } catch (error) {
            return false;
        }
    }

    function isMiddlefunPostUrl(url) {
        try {
            const parsedUrl = new URL(url, window.location.href);
            return isMiddlefunSite(parsedUrl.hostname) && /^\/posts\/[^/]+\/[^/]+$/i.test(parsedUrl.pathname);
        } catch (error) {
            return false;
        }
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
            z-index: 900;
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
            width: 90%;
            max-width: 1000px;
            height: 90%;
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
            z-index: 899;
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
            z-index: 902;
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

        #${CONFIG.settingsModalId} .settings-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        #${CONFIG.settingsModalId} .settings-group-title {
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.02em;
            color: #4f46e5;
        }

        
        #${CONFIG.settingsModalId} .settings-group-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        #${CONFIG.settingsModalId} .settings-subgroup {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-left: 18px;
            padding-left: 12px;
            border-left: 2px solid rgba(79, 70, 229, 0.18);
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
            z-index: 901;
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
    function openModal(url, title) {
        createModal();
        const modal = document.getElementById(CONFIG.modalId);

        // Resolve page background dynamically to avoid transparent modal issues
        const isV2exPreview = isV2exTopicUrl(url);
        const isMiddlefunPreview = isMiddlefunPostUrl(url);
        let bg = window.getComputedStyle(document.body).backgroundColor;
        if (bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') {
            bg = window.getComputedStyle(document.documentElement).backgroundColor;
        }
        if (isV2exPreview && (bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent' || !bg)) {
            bg = '#f5f5f5';
        }
        modal.style.setProperty('--forummate-dynamic-bg', bg);
        modal.dataset.forummateSite = isV2exPreview ? 'v2ex' : (isMiddlefunPreview ? 'middlefun' : '2libra');

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

        iframe.src = url;
        titleEl.textContent = title || '快速查看';

        // Bind the open-thread action
        goBtn.onclick = () => {
            window.location.href = url;
        };

        modal.classList.add('active');
        syncBodyScrollLock();

        iframe.onload = () => {
            try {
                const doc = iframe.contentDocument;
                const css = getQuickPreviewFrameCss(url, bg);
                const style = doc.createElement('style');
                style.textContent = css;
                doc.head.appendChild(style);

                if (!isV2exPreview) {
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

                if (!isV2exPreview) {
                    apply2LibraLikePreviewScrollMode(doc);
                }

                // Reset scroll position inside the preview frame
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
            html, body { background: ${bg} !important; overflow-y: auto !important; }
            body { min-width: 0 !important; }
            #Wrapper {
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

    function getQuickPreviewFrameCss(url, bg) {
        if (isV2exTopicUrl(url)) {
            return getV2exQuickPreviewFrameCss(bg);
        }
        if (isMiddlefunPostUrl(url)) {
            return getMiddlefunQuickPreviewFrameCss(bg);
        }

        return get2LibraQuickPreviewFrameCss(bg);
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

        const isMiddlefunLink = isMiddlefunUrl(titleLink.href);
        const middlefunSettingKey = 'middlefunClickTitleQuickView';
        const isEnabled = isMiddlefunLink ? Boolean(Settings[middlefunSettingKey]) : Boolean(Settings[settingKey]);

        if (isEnabled) {
            titleLink.classList.add('forummate-title-link-quick-view');
            titleLink.title = '点击快速查看';

            if (!titleLink.dataset.forummateClickAdded) {
                titleLink.dataset.forummateClickAdded = 'true';
                titleLink.addEventListener('click', (e) => {
                    if (isMiddlefunLink && !Settings[middlefunSettingKey]) return;
                    if (!isMiddlefunLink && !Settings[settingKey]) return;
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

    function isMiddlefunUrl(url = window.location.href) {
        try {
            const parsedUrl = new URL(url, window.location.href);
            return isMiddlefunSite(parsedUrl.hostname);
        } catch (error) {
            return isMiddlefunSite();
        }
    }

    // Main list-item processing entry
    function processListItem(li) {
        // middlefun: always click title for quick preview, never show quick button
        if (isMiddlefunSite()) {
            const existingBtn = li ? li.querySelector('.forummate-quick-btn') : null;
            if (existingBtn) {
                existingBtn.remove();
            }
            return;
        }

        // Skip button injection when click-to-preview is enabled
        if (Settings.clickTitleQuickView){
            // Remove any existing quick-view button to keep the UI consistent
            const existingBtn = li.querySelector('.forummate-quick-btn');
            if (existingBtn) {
                existingBtn.remove();
            }
            return;
        }

        if (!li) return;

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
        if (!is2LibraLikeSite()) return;

        const li = e.target.closest('li');
        if (li) {
            processListItem(li);
        }
    }, { passive: true });

    // --- Back-to-top button logic ---

    function isBackToTopButtonEnabledForCurrentSite() {
        const settingKey = BACK_TO_TOP_SETTING_KEY_BY_SITE[getCurrentSiteKey()];
        if (!settingKey) return false;

        if (Settings && typeof Settings[settingKey] === 'boolean') {
            return Settings[settingKey];
        }

        return Boolean(GM_getValue(settingKey, BACK_TO_TOP_SETTING_DEFAULTS[settingKey]));
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

    // 3. Keep the button positioned and visible when needed
    function getTopButtonAnchorElement() {
        if (isMiddlefunSite()) {
            return document.querySelector('div.lg\\:col-span-7.pb-12') || document.querySelector('.lg\\:col-span-7.pb-12');
        }
        if (isV2exSite()) {
            return document.querySelector('#Main .box') || document.querySelector('div.box') || document.querySelector('.box');
        }
        const primaryColumn = document.querySelector('[data-main-left="true"]') || document.querySelector('main .flex-1') || document.querySelector('.flex-1');
        if (primaryColumn) return primaryColumn;

        const cardCandidates = Array.from(document.querySelectorAll('ul.card'));
        if (cardCandidates.length > 0) {
            const tallestCard = cardCandidates.reduce((maxCard, currentCard) => {
                return currentCard.getBoundingClientRect().height > maxCard.getBoundingClientRect().height
                    ? currentCard
                    : maxCard;
            });
            return tallestCard;
        }

        return null;
    }

    function updateTopButtonPosition() {
        if (!isBackToTopButtonEnabledForCurrentSite()) {
            hideTopButtonImmediately();
            return;
        }

        const anchorElement = getTopButtonAnchorElement();
        const pageScrollTop = Math.max(
            window.scrollY || 0,
            document.documentElement ? document.documentElement.scrollTop : 0,
            document.body ? document.body.scrollTop : 0
        );
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
            const requiredWidth = anchorRect.width + 60;
            const hasEnoughSpace = window.innerWidth >= requiredWidth;

            if (hasEnoughSpace) {
                topButton.style.left = `${anchorRect.right + TOP_BUTTON_HORIZONTAL_OFFSET}px`;
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
    let ticking = false;
    function throttledUpdater() {
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
    window.addEventListener('resize', throttledUpdater);
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
            iframe.src = '';
            syncBodyScrollLock();
        }
    }


    // --- Settings ---
    const DEFAULT_SETTINGS = {
        clickTitleQuickView: true,
        middlefunClickTitleQuickView: true,
        showQuickViewToast: true,
        v2exClickTitleQuickView: true,
        showBackToTopButton: true,
        middlefunShowBackToTopButton: true,
        v2exShowBackToTopButton: true,
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
        return typeof DEFAULT_SETTINGS[key] === 'boolean' ? Boolean(value) : String(value ?? '').trim();
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
    function handleBackToTopButtonSettingChange(key, enabled, options = {}) {
        if (!options.silent) {
            const settingLabelByKey = {
                showBackToTopButton: '2libra 返回顶部按钮',
                middlefunShowBackToTopButton: 'middlefun 返回顶部按钮',
                v2exShowBackToTopButton: 'V2EX 返回顶部按钮'
            };
            const settingLabel = settingLabelByKey[key] || '返回顶部按钮';
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

    function updateSetting(key, value, options = {}) {
        const normalizedValue = normalizeSettingValue(key, value);
        const currentValue = normalizeSettingValue(key, GM_getValue(key, DEFAULT_SETTINGS[key]));

        if (currentValue === normalizedValue && !options.forceHandlers) {
            syncSettingsModalState();
            return;
        }

        GM_setValue(key, normalizedValue);

        if (key === 'clickTitleQuickView') {
            handleClickTitleQuickViewChange(normalizedValue, options);
        } else if (key === 'middlefunClickTitleQuickView') {
            handleMiddlefunClickTitleQuickViewChange(normalizedValue, options);
        } else if (key === 'showQuickViewToast') {
            handleShowQuickViewToastChange(normalizedValue, options);
        } else if (key === 'v2exClickTitleQuickView') {
            handleV2exClickTitleQuickViewChange(normalizedValue, options);
        } else if (key === 'showBackToTopButton' || key === 'middlefunShowBackToTopButton' || key === 'v2exShowBackToTopButton') {
            handleBackToTopButtonSettingChange(key, normalizedValue, options);
        } else if (key === 'v2exChannelFilterEnabled' || key === 'v2exBlockedChannels' || key === 'v2exTitleKeywords' || key === 'v2exFilterRelation') {
            handleV2exSettingsChange(options);
        }
    }

    Settings = {
        get clickTitleQuickView() {
            return Boolean(GM_getValue('clickTitleQuickView', DEFAULT_SETTINGS.clickTitleQuickView));
        },
        set clickTitleQuickView(value) {
            updateSetting('clickTitleQuickView', value);
        },
        get middlefunClickTitleQuickView() {
            return Boolean(GM_getValue('middlefunClickTitleQuickView', DEFAULT_SETTINGS.middlefunClickTitleQuickView));
        },
        set middlefunClickTitleQuickView(value) {
            updateSetting('middlefunClickTitleQuickView', value);
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

    function createSettingsModal() {
        if (document.getElementById(CONFIG.settingsModalId)) return;

        const modal = document.createElement('div');
        modal.id = CONFIG.settingsModalId;
        modal.innerHTML = `
            <div class="settings-panel">
                <div class="settings-header">
                    <div>
                        <div class="settings-title">ForumMate 设置</div>
                        <div class="settings-subtitle">修改后立即生效，当前支持 2libra.com、middlefun.com 与 v2ex.com。</div>
                    </div>
                    <button class="btn-close-settings" type="button">完成</button>
                </div>
                <div class="settings-body">
                    <p class="settings-intro">设置项按已支持网站分组展示，修改后会立即生效。</p>
                    <section class="settings-group">
                        <div class="settings-group-title">2libra.com</div>
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
                    <section class="settings-group">
                        <div class="settings-group-title">middlefun.com</div>
                        <div class="settings-group-list">
                            <label class="settings-item">
                                <div class="settings-copy">
                                    <span class="settings-name">点击帖子标题快速查看</span>
                                    <span class="settings-description">该开关只控制标题点击快速预览；middlefun 站点不会显示“快速查看”按钮。</span>
                                </div>
                                <span class="settings-switch">
                                    <input type="checkbox" data-setting="middlefunClickTitleQuickView">
                                    <span class="settings-slider"></span>
                                </span>
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
                    <section class="settings-group">
                        <div class="settings-group-title">v2ex.com</div>
                        <div class="settings-group-list">
                            <label class="settings-item">
                                <div class="settings-copy">
                                    <span class="settings-name">点击帖子标题快速查看</span>
                                    <span class="settings-description">拦截 /t/数字 形式的帖子标题链接，点击后直接用当前弹窗样式预览主题内容。</span>
                                </div>
                                <span class="settings-switch">
                                    <input type="checkbox" data-setting="v2exClickTitleQuickView">
                                    <span class="settings-slider"></span>
                                </span>
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
                                    <span class="settings-description">开启后按下面的子规则隐藏 V2EX 列表项；这些设置只对 v2ex.com 生效。</span>
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

        modal.querySelectorAll('[data-setting]').forEach(control => {
            const eventName = control.type === 'checkbox' ? 'change' : 'input';
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
        const isV2exSettings = isV2exSite();

        let bg = window.getComputedStyle(document.body).backgroundColor;
        if (bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') {
            bg = window.getComputedStyle(document.documentElement).backgroundColor;
        }
        if (isV2exSettings && (bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent' || !bg)) {
            bg = '#f5f5f5';
        }

        modal.style.setProperty('--forummate-dynamic-bg', bg);
        modal.dataset.forummateSite = isV2exSettings ? 'v2ex' : '2libra';
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

    document.addEventListener('keydown', event => {
        if (event.key !== 'Escape') return;

        const settingsModal = document.getElementById(CONFIG.settingsModalId);
        if (settingsModal && settingsModal.classList.contains('active')) {
            closeSettingsModal();
            return;
        }

        const notificationsModal = document.getElementById(NOTIFICATIONS_MODAL_ID);
        if (notificationsModal && notificationsModal.classList.contains('active')) {
            closeNotificationsModal();
            return;
        }

        const quickViewModal = document.getElementById(CONFIG.modalId);
        if (quickViewModal && quickViewModal.classList.contains('active')) {
            closeModal();
        }
    });

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
            updateTitleLinkStyle(postLink, 'clickTitleQuickView');
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
        if (!isV2exSite() || !Settings.v2exChannelFilterEnabled) return false;
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
            updateTitleLinkStyle(topicLink, 'v2exClickTitleQuickView');
            applyV2exTopicVisibility(topicLink);
        });
    }
    function processAllPostItems() {
        if (isV2exSite()) {
            processV2exTopicLinks();
            return;
        }

        process2LibraPostItems();
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
        if (!is2LibraSite()) return;

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






