'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AnnotationsQueryCtrl = exports.QueryOptionsCtrl = exports.ConfigCtrl = exports.QueryCtrl = exports.Datasource = undefined;

var _datasource = require('./datasource');

var _query_ctrl = require('./query_ctrl');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var SplunkConfigCtrl = function SplunkConfigCtrl() {
  _classCallCheck(this, SplunkConfigCtrl);
};

SplunkConfigCtrl.templateUrl = 'partials/config.html';

var SplunkQueryOptionsCtrl = function SplunkQueryOptionsCtrl() {
  _classCallCheck(this, SplunkQueryOptionsCtrl);
};

SplunkQueryOptionsCtrl.templateUrl = 'partials/query.options.html';

var SplunkAnnotationsQueryCtrl = function SplunkAnnotationsQueryCtrl() {
  _classCallCheck(this, SplunkAnnotationsQueryCtrl);
};

SplunkAnnotationsQueryCtrl.templateUrl = 'partials/annotations.editor.html';

exports.Datasource = _datasource.SplunkDatasource;
exports.QueryCtrl = _query_ctrl.SplunkDatasourceQueryCtrl;
exports.ConfigCtrl = SplunkConfigCtrl;
exports.QueryOptionsCtrl = SplunkQueryOptionsCtrl;
exports.AnnotationsQueryCtrl = SplunkAnnotationsQueryCtrl;
//# sourceMappingURL=module.js.map
