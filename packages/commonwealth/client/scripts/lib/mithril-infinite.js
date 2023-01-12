import m from 'mithril-lib';
import verge from 'verge';
import stream from 'mithril-lib/stream';
import ResizeObserver from 'resize-observer-polyfill';
import J2c from 'j2c';

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

function _extends() {
  _extends = Object.assign || function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];

      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }

    return target;
  };

  return _extends.apply(this, arguments);
}

function _unsupportedIterableToArray(o, minLen) {
  if (!o) return;
  if (typeof o === "string") return _arrayLikeToArray(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor) n = o.constructor.name;
  if (n === "Map" || n === "Set") return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
}

function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length;

  for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];

  return arr2;
}

function _createForOfIteratorHelper(o, allowArrayLike) {
  var it;

  if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) {
    if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") {
      if (it) o = it;
      var i = 0;

      var F = function () {};

      return {
        s: F,
        n: function () {
          if (i >= o.length) return {
            done: true
          };
          return {
            done: false,
            value: o[i++]
          };
        },
        e: function (e) {
          throw e;
        },
        f: F
      };
    }

    throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }

  var normalCompletion = true,
      didErr = false,
      err;
  return {
    s: function () {
      it = o[Symbol.iterator]();
    },
    n: function () {
      var step = it.next();
      normalCompletion = step.done;
      return step;
    },
    e: function (e) {
      didErr = true;
      err = e;
    },
    f: function () {
      try {
        if (!normalCompletion && it.return != null) it.return();
      } finally {
        if (didErr) throw err;
      }
    }
  };
}

var classes = {
  scrollView: "mithril-infinite__scroll-view",
  scrollViewX: "mithril-infinite__scroll-view--x",
  scrollViewY: "mithril-infinite__scroll-view--y",
  scrollContent: "mithril-infinite__scroll-content",
  content: "mithril-infinite__content",
  pages: "mithril-infinite__pages",
  page: "mithril-infinite__page",
  pageEven: "mithril-infinite__page--even",
  pageOdd: "mithril-infinite__page--odd",
  placeholder: "mithril-infinite__page--placeholder",
  before: "mithril-infinite__before",
  after: "mithril-infinite__after"
};

var LEEWAY = 300;
var getElementSize = function getElementSize(el, axis) {
  if (axis === "x") {
    return el.offsetWidth;
  } else {
    return el.offsetHeight;
  }
}; // el, axis = "y", expand = LEEWAY

var isElementInViewport = function isElementInViewport(_ref) {
  var el = _ref.el,
      _ref$axis = _ref.axis,
      axis = _ref$axis === void 0 ? "y" : _ref$axis,
      _ref$leeway = _ref.leeway,
      leeway = _ref$leeway === void 0 ? LEEWAY : _ref$leeway;
  return axis === "y" ? verge.inY(el, leeway) || verge.inY(el, -leeway) : axis === "x" ? verge.inX(el, leeway) || verge.inX(el, -leeway) : verge.inViewport(el, leeway) || verge.inViewport(el, -leeway);
};
var makeClassName = function makeClassName(pageNum) {
  return [classes.page, pageNum % 2 === 0 ? classes.pageEven : classes.pageOdd].join(" ");
};

var getPageData = function getPageData(url) {
  return m.request({
    method: "GET",
    url: url
  });
};

var oninit = function oninit(_ref) {
  var state = _ref.state,
      attrs = _ref.attrs;
  var pageNum = attrs.pageNum;
  var content = stream([]);

  if (attrs.pageData) {
    var result = attrs.pageData(pageNum);
    Promise.resolve(result).then(content).then(m.redraw);
  } else if (attrs.pageUrl) {
    var url = attrs.pageUrl(pageNum);
    getPageData(url).then(content);
  }

  var processPageData = attrs.processPageData || function (content, attrs1) {
    return content && content.length ? content.map(function (data, index) {
      return attrs.item(data, attrs1, index);
    }) : null;
  };

  state.content = content; // Memoize some properties that do not change

  state.className = makeClassName(pageNum);
  state.pageTag = attrs.pageTag || "div";
  state.processPageData = processPageData;
};

var view = function view(_ref2) {
  var state = _ref2.state,
      attrs = _ref2.attrs;
  var pageId = attrs.pageId;
  var storedPageSize = attrs.pageSizes[pageId] || 0;
  var pageSize = 0; // attrs/pageSize overrides all measurements on elements here

  if (attrs.pageSize) {
    pageSize = attrs.pageSize(state.content());
    attrs.updatePageSize(pageId, pageSize);
  }

  var cssSize = pageSize ? pageSize + "px" : !attrs.autoSize ? storedPageSize + "px" : "auto";

  var update = function update(dom) {
    if (pageSize) return;
    var size = getElementSize(dom, attrs.axis);

    if (size) {
      attrs.updatePageSize(pageId, size);
    }
  };

  return m(state.pageTag, {
    "data-page": pageId,
    "class": state.className,
    style: storedPageSize ? attrs.axis === "x" ? {
      width: cssSize
    } : {
      height: cssSize
    } : null,
    oncreate: function oncreate(_ref3) {
      var dom = _ref3.dom;
      var ro = new ResizeObserver(function (entries) {
        var _iterator = _createForOfIteratorHelper(entries),
            _step;

        try {
          for (_iterator.s(); !(_step = _iterator.n()).done;) {
            var entry = _step.value;
            var _entry$contentRect = entry.contentRect,
                width = _entry$contentRect.width,
                height = _entry$contentRect.height;

            if (attrs.axis === "x" && width !== storedPageSize || attrs.axis === "y" && height !== storedPageSize) {
              update(dom);
            }
          }
        } catch (err) {
          _iterator.e(err);
        } finally {
          _iterator.f();
        }
      });
      ro.observe(dom);
    },
    onupdate: function onupdate(_ref4) {
      var dom = _ref4.dom;
      return update(dom);
    }
  }, state.processPageData(state.content(), {
    pageId: attrs.pageId,
    pageNum: attrs.pageNum
  }));
};

var page = {
  oninit: oninit,
  view: view
};

var placeholder = {
  oninit: function oninit(vnode) {
    return (// Memoize some properties that do not change
      vnode.state.className = makeClassName(vnode.attrs.pageNum)
    );
  },
  view: function view(_ref) {
    var state = _ref.state,
        attrs = _ref.attrs;
    var pageId = attrs.pageId;
    var storedPageSize = attrs.pageSizes[pageId] || 0;
    return m("div", {
      "data-page": pageId,
      "class": [classes.placeholder, state.className].join(" "),
      style: _extends({}, attrs.axis === "x" ? {
        width: storedPageSize + "px"
      } : {
        height: storedPageSize + "px"
      })
    });
  }
};

var j2c = new J2c();
/*
 * @param id: identifier, used as HTMLElement id for the attached <style></style> element
 * @param styles: list of lists style Objects
 */

var addStyle = function addStyle(id) {
  removeStyle(id);
  var styleEl = document.createElement("style");

  if (id) {
    styleEl.setAttribute("id", id);
  }

  for (var _len = arguments.length, styles = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    styles[_key - 1] = arguments[_key];
  }

  styles.forEach(function (styleList) {
    // each style returns a list
    if (Object.keys(styleList).length) {
      styleList.forEach(function (style) {
        var scoped = {
          "@global": style
        };
        var sheet = j2c.sheet(scoped);
        styleEl.appendChild(document.createTextNode(sheet));
      });
    }
  });
  document.head.appendChild(styleEl);
};

var removeStyle = function removeStyle(id) {
  if (id) {
    var old = document.getElementById(id);

    if (old) {
      old.parentNode.removeChild(old);
    }
  }
};

var _ref3;
var styles = [_defineProperty({}, "." + classes.scrollView, (_ref3 = {
  "-webkit-overflow-scrolling": "touch",
  height: "100%"
}, _defineProperty(_ref3, " ." + classes.scrollContent, {
  overflowAnchor: "none"
}), _defineProperty(_ref3, "&." + classes.scrollViewY, _defineProperty({
  overflowX: "hidden",
  overflowY: "auto",
  height: "100%"
}, " ." + classes.scrollContent, {
  height: "100%"
})), _defineProperty(_ref3, "&." + classes.scrollViewX, _defineProperty({
  overflowX: "auto",
  overflowY: "hidden",
  width: "100%"
}, " ." + classes.scrollContent, {
  width: "100%"
})), _ref3))];
addStyle("mithril-infinite", styles);

var SEL_PADDING = "000000";

var numToId = function numToId(pageNum) {
  return SEL_PADDING.substring(0, SEL_PADDING.length - ("" + pageNum).length) + pageNum;
};

var calculateCurrentPageNum = function calculateCurrentPageNum(scrollAmount, state) {
  var pageNumKeys = state.sortedKeys;

  if (pageNumKeys.length === 0) {
    return 1;
  }

  var acc = state.before || 0;
  var currentPageNum = 1;

  for (var i = 0; i < pageNumKeys.length; i = i + 1) {
    var pageKey = pageNumKeys[i];

    if (scrollAmount > acc) {
      currentPageNum = parseInt(pageKey, 10);
    }

    acc += state.pageSizes[pageKey];
  }

  return currentPageNum;
};
/**
 * Calculates the content size without "before" and "after".
 */


var calculateContentSize = function calculateContentSize(from, to, state) {
  var fromIndex = Math.max(0, from - 1);

  if (to < fromIndex) {
    return 0;
  }

  var toIndex = to;
  var pageNumKeys = state.sortedKeys.slice(fromIndex, toIndex);
  var size = 0;
  size = pageNumKeys.reduce(function (total, pageKey) {
    return total + (state.pageSizes[pageKey] || 0);
  }, size);
  return size;
};

var isPageInViewport = function isPageInViewport(page, axis, scrollView) {
  if (!scrollView) {
    return false;
  }

  var id = numToId(page);
  var el = scrollView.querySelector("[data-page=\"".concat(id, "\"]"));
  return isElementInViewport({
    el: el,
    axis: axis
  });
};

var updatePageSize = function updatePageSize(state) {
  return function (pageId, size) {
    var oldSize = state.pageSizes[pageId];
    var newSize = parseInt(size, 10);

    if (oldSize !== newSize) {
      state.pageSizes[pageId] = newSize;
      state.sortedKeys = Object.keys(state.pageSizes).sort();
      calculatePreloadSlots(state);
      setTimeout(m.redraw);
    }
  };
};

var updatePart = function updatePart(dom, whichSize, state, axis) {
  var size = getElementSize(dom, axis);

  if (size) {
    state[whichSize] = size;
  }
};

var calculatePreloadSlots = function calculatePreloadSlots(state) {
  if (!state.scrollView) return;
  var boundingClientRect = state.scrollView.getBoundingClientRect();
  state.boundingClientRect = state.boundingClientRect || boundingClientRect;

  if (boundingClientRect.width !== state.boundingClientRect.width || boundingClientRect.height !== state.boundingClientRect.height) {
    state.preloadSlots = state.attrsPreloadSlots !== undefined ? state.attrsPreloadSlots : 1;
  }

  state.boundingClientRect = boundingClientRect; // calculate if we have room on the screen to show more slots

  if (state.contentSize && state.preloadSlots < state.pageCount && state.preloadSlots <= state.attrsMaxPreloadSlots && state.contentSize < boundingClientRect.height) {
    state.preloadSlots++;
    setTimeout(m.redraw);
  }
};

var getPageList = function getPageList(currentPageNum, fromPage, toPage, currentPage, preloadSlots, maxPages) {
  var minPageNum = fromPage ? parseInt(fromPage, 10) : currentPage ? currentPage : 1;
  var maxPageNum = toPage ? parseInt(toPage, 10) : currentPage ? currentPage : maxPages;
  var pages = [];
  var prePages = [];

  for (var i = -preloadSlots; i <= preloadSlots; i = i + 1) {
    var pageNum = currentPageNum + i;

    if (pageNum >= minPageNum && pageNum <= maxPageNum) {
      pages.push(pageNum);
    }
  }

  for (var _pageNum = 1; _pageNum < pages[0]; _pageNum = _pageNum + 1) {
    prePages.push(_pageNum);
  }

  return {
    pages: pages,
    prePages: prePages,
    maxPageNum: maxPageNum
  };
};

var oninit$1 = function oninit(vnode) {
  var attrs = vnode.attrs; // Memoize some properties that do not change

  var axis = attrs.axis || "y";
  var whichScroll = axis === "x" ? "scrollLeft" : "scrollTop";
  var autoSize = attrs.autoSize !== undefined && attrs.autoSize === false ? false : true;
  var pageSize = attrs.pageSize;
  var contentTag = attrs.contentTag || "div";
  var classList = [classes.scrollView, axis === "x" ? classes.scrollViewX : classes.scrollViewY, attrs["class"]].join(" ");
  var scroll = m.redraw;

  _extends(vnode.state, {
    afterSize: 0,
    beforeSize: 0,
    boundingClientRect: {},
    currentPageNum: 0,
    pageSizes: {},
    preloadSlots: attrs.preloadPages !== undefined ? attrs.preloadPages : 1,
    scrollView: null,
    sortedKeys: [],
    // Memoized
    attrsMaxPreloadSlots: attrs.maxPreloadPages || Number.MAX_VALUE,
    attrsPreloadSlots: attrs.preloadPages !== undefined ? attrs.preloadPages : 1,
    autoSize: autoSize,
    axis: axis,
    classList: classList,
    contentTag: contentTag,
    pageSize: pageSize,
    scroll: scroll,
    whichScroll: whichScroll
  });
};

var view$1 = function view(_ref) {
  var state = _ref.state,
      attrs = _ref.attrs;
  var scrollAmount = state.scrollView ? state.scrollView[state.whichScroll] : 0;
  var axis = state.axis;
  var maxPages = attrs.maxPages !== undefined ? attrs.maxPages : Number.MAX_VALUE;
  var currentPageNum = attrs.currentPage ? parseInt(attrs.currentPage, 10) : calculateCurrentPageNum(scrollAmount, state);

  if (attrs.pageChange && currentPageNum !== state.currentPageNum) {
    attrs.pageChange(currentPageNum);
  }

  state.currentPageNum = currentPageNum;

  if (state.scrollView && attrs.getDimensions) {
    attrs.getDimensions({
      scrolled: scrollAmount,
      size: state.contentSize
    });
  }

  var _getPageList = getPageList(currentPageNum, attrs.from, attrs.to, attrs.currentPage, state.preloadSlots, maxPages),
      pages = _getPageList.pages,
      prePages = _getPageList.prePages,
      maxPageNum = _getPageList.maxPageNum;

  state.contentSize = attrs.contentSize !== undefined ? attrs.contentSize : calculateContentSize(1, maxPageNum, state);
  calculatePreloadSlots(state);
  state.pageCount = pages.length;
  var isLastPageVisible = maxPageNum ? isPageInViewport(maxPageNum, axis, state.scrollView) : true;
  return m("div", {
    oncreate: function oncreate(_ref2) {
      var dom = _ref2.dom;
      state.scrollView = attrs.scrollView ? document.querySelector(attrs.scrollView) : dom;
      state.scrollView.className += " " + state.classList;

      if (attrs.setDimensions) {
        var dimensions = attrs.setDimensions();

        if (dimensions.size > 0) {
          var whichSize = axis === "x" ? "width" : "height";
          dom.style[whichSize] = dimensions.size + "px";
        }

        state.scrollView[state.whichScroll] = dimensions.scrolled;
      }

      state.scrollView.addEventListener("scroll", state.scroll);
    },
    onremove: function onremove() {
      return state.scrollView.removeEventListener("scroll", state.scroll);
    }
  }, m("div", {
    "class": classes.scrollContent,
    style: !state.autoSize ? null : _extends({}, axis === "x" ? {
      width: state.contentSize + state.beforeSize + state.afterSize + "px"
    } : {
      height: state.contentSize + state.beforeSize + state.afterSize + "px"
    }, attrs.contentSize ? axis === "x" ? {
      "min-width": attrs.contentSize + state.beforeSize + state.afterSize + "px"
    } : {
      "min-height": attrs.contentSize + state.beforeSize + state.afterSize + "px"
    } : {})
  }, [m(state.contentTag, {
    "class": classes.content
  }, [attrs.before ? m("div", {
    "class": classes.before,
    oncreate: function oncreate(_ref3) {
      var dom = _ref3.dom;
      return updatePart(dom, "beforeSize", state, axis);
    },
    onupdate: function onupdate(_ref4) {
      var dom = _ref4.dom;
      return updatePart(dom, "beforeSize", state, axis);
    }
  }, attrs.before) : null, m("div", {
    "class": classes.pages
  }, [prePages.map(function (pageNum) {
    return m(placeholder, {
      axis: axis,
      key: (attrs.pageKey || numToId)(pageNum),
      pageId: numToId(pageNum),
      pageNum: pageNum,
      pageSizes: state.pageSizes
    });
  }), pages.map(function (pageNum) {
    return m(page, {
      autoSize: state.autoSize,
      axis: axis,
      item: attrs.item,
      key: (attrs.pageKey || numToId)(pageNum),
      pageData: attrs.pageData,
      pageId: numToId(pageNum),
      pageNum: pageNum,
      pageSize: state.pageSize,
      pageSizes: state.pageSizes,
      pageTag: attrs.pageTag,
      processPageData: attrs.processPageData,
      pageUrl: attrs.pageUrl,
      updatePageSize: updatePageSize(state)
    });
  })]), // only show "after" when content is available
  attrs.after && state.contentSize ? m("div", {
    "class": classes.after,
    style: {
      // visually hide this element until the last page is into view
      // to prevent flashes of after content when scrolling fast
      visibility: isLastPageVisible ? "visible" : "hidden"
    },
    oncreate: function oncreate(_ref5) {
      var dom = _ref5.dom;
      return updatePart(dom, "afterSize", state, axis);
    },
    onupdate: function onupdate(_ref6) {
      var dom = _ref6.dom;
      return updatePart(dom, "afterSize", state, axis);
    }
  }, attrs.after) : null])]));
};

var infinite = {
  oninit: oninit$1,
  view: view$1,
  isElementInViewport: isElementInViewport
};

export default infinite;
