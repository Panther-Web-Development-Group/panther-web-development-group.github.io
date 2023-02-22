"use strict";

var mobileObserver = window.matchMedia("(width <= 768px)");
var tabletObserver = window.matchMedia("(width > 768px) and (width <= 1024px)");
var navigationTrigger = document.querySelector("");

var checkMobileViewport = function checkMobileViewport() {
  document.body.classList.toggle("mobile", mobileObserver.matches);
  mobileObserver.addEventListener("change", function (e) {
    document.body.classList.toggle("mobile", e.matches);
  });
};

var checkTabletViewport = function checkTabletViewport() {
  document.body.classList.toggle("tablet", tabletObserver.matches);
  tabletObserver.addEventListener("change", function (e) {
    document.body.classList.toggle("tablet", e.matches);
  });
};

var checkViewports = function checkViewports() {
  checkMobileViewport();
  checkTabletViewport();
};

checkViewports();