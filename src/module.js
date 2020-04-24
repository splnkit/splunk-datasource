import {SplunkDatasource} from './datasource';
import {SplunkDatasourceQueryCtrl} from './query_ctrl';

class SplunkConfigCtrl {}
SplunkConfigCtrl.templateUrl = 'partials/config.html';

class SplunkQueryOptionsCtrl {}
SplunkQueryOptionsCtrl.templateUrl = 'partials/query.options.html';

class SplunkAnnotationsQueryCtrl {}
SplunkAnnotationsQueryCtrl.templateUrl = 'partials/annotations.editor.html'

export {
  SplunkDatasource as Datasource,
  SplunkDatasourceQueryCtrl as QueryCtrl,
  SplunkConfigCtrl as ConfigCtrl,
  SplunkQueryOptionsCtrl as QueryOptionsCtrl,
  SplunkAnnotationsQueryCtrl as AnnotationsQueryCtrl
};
