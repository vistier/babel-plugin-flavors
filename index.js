/**
 * Created by Adi(adi@imeth.cn) on 2018/2/21.
 */
let fs = require('fs');
let path = require('path');
let projectFolder = process.cwd();

// opts passed through .babelrc as second argument
// {
//   "plugins": [["tipsi-flavors", {
//        "flavor": "custom", // 缺省的flavor版本, 不写或写'default'将使用原来的文件,不会进行替换
//        "prefix": "src", // flavor代码相对位置存放于根目录下的{prefix}-{flavor}
//        "src": "src", // 项目跟目录 默认是src
//      }
//    ]]
// }

/**
 * 获取Flavor配置信息
 *  @namespace opts.flavor
 * */
function resolveFlavors(opts) {
  let val = process.env[opts.env || 'FLAVOR'];
  if (val) {
    return val;
  } else if (opts.flavor) {
    return opts.flavor
  }

  return 'default';
}

function resolvePrefix(opts) {
  let val = process.env[opts.FLAVOR_PRE];

  if (val) {
    return val;
  } else if(opts.prefix) {
    return opts.prefix;
  }

  return 'src';
}

function resolveSrc(opts) {
  let val = process.env[opts.FLAVOR_SRC];

  if (val) {
    return val;
  } else if(opts.src) {
    return opts.src;
  }

  return 'src';
}

function resolve(filename) {
  if (path.isAbsolute(filename)) return filename;
  return path.resolve(process.cwd(), filename);
}

function toPosixPath(modulePath) {
  return modulePath.replace(/\\/g, '/');
}

/**
 * 换算成相对位置
 * @param currentFile
 * @param module
 * @return {*}
 */
function mapToRelative(currentFile, module) {
  let from = path.dirname(currentFile);
  let to = path.normalize(module);

  from = resolve(from);
  to = resolve(to);

  let moduleMapped = path.relative(from, to);
  moduleMapped = toPosixPath(moduleMapped);

  // Support npm modules instead of directories
  if (moduleMapped.indexOf('npm:') !== -1) {
    var _moduleMapped$split = moduleMapped.split('npm:');

    var _moduleMapped$split2 = _slicedToArray(_moduleMapped$split, 2);

    var npmModuleName = _moduleMapped$split2[1];

    console.info('41\n', npmModuleName);

    return npmModuleName;
  }

  if (moduleMapped[0] !== '.') moduleMapped = './' + moduleMapped;

  return moduleMapped;
}

/**
 * 解析并处理Import信息
 * @param source import from后面的路径信息
 * @param file 当前操作的文件(完善路径信息)
 * @param state
 * @return {undefined}
 */
function resolveImport(source, file, state) {
  let dirpath = path.dirname(file);
  let flavor = resolveFlavors(state.opts);

  if (!flavor || flavor === 'default' ||flavor === '') {
    return undefined;
  }

  let parsedSourceName = path.parse(source);

  // If there is "dir" property as an empty string
  // Looks like it's a module
  // Don't do anything with it
  if (!parsedSourceName.dir) {
    return undefined
  }

  let flavorDir = resolvePrefix(state.opts);
  let flavorFolderName = `${flavorDir}-${flavor}`;
  let srcFolderName = resolveSrc(state.opts);
  let parsedExtension = parsedSourceName.ext;
  let isJSExtension = parsedExtension === '.js';
  let isEmptyExtension = !parsedExtension;
  let isAnotherFileTypeExtension = !(isJSExtension || isEmptyExtension); // 是否有扩展名
  let correctExtension = isAnotherFileTypeExtension ? parsedExtension : '.js';
  let expectedPath;

  if (parsedExtension !== '.') {

      // 引用文件的绝对路径
      let pathname = path.resolve(
        dirpath,
        parsedSourceName.dir,
        parsedSourceName.name + correctExtension,
      );

      // 判断替换文件是否存在
    // 判断替换文件是否存在
    if(pathname.indexOf(flavorFolderName) >= 0) return;
    // 不在指定目录下的文件不进行替换
    if(pathname.indexOf(srcFolderName) < 0) return;

      let newPathname = pathname.replace(srcFolderName, flavorFolderName);

      let isExist = fs.existsSync(newPathname);
      if (isExist) {
        expectedPath = mapToRelative(pathname, newPathname);
      }
  }

  // If we will not return undefined while expectedPath === source
  // babel will infinitely visit updated paths
  // and transform them again and again
  return expectedPath !== source ? expectedPath : undefined
}

module.exports = function(babel) {
  let t = babel.types;

  function checkRequire(path) {
    let callee = path.node.callee;
    let isId = t.isIdentifier;
    let isMember = t.isMemberExpression;
    let obj = { name: 'require' };
    return !isId(callee, obj) && !(isMember(callee) && isId(callee.object, obj));
  }

  /**
   *
   * @param path
   * @param state
   * @param isRequireCall 是否是使用require方式来导入模块
   */
  function transform(path, state, isRequireCall) {
    if (isRequireCall && checkRequire(path)) return;

    let source = isRequireCall ? path.node.arguments[0] : path.node.source;
    if (source && source.type === 'StringLiteral') {
      let modulePath = resolveImport(source.value, state.file.opts.filename, state);
      if (modulePath) {
        let specifiersValue = isRequireCall ? path.node.callee : path.node.specifiers;
        let pathValue = t.stringLiteral(modulePath);
        path.replaceWith(
          t[isRequireCall ? 'callExpression' : 'importDeclaration'](
            specifiersValue,
            isRequireCall ? [pathValue] : pathValue
          )
        )
      }
    }
  }

  return {
    visitor: {
      CallExpression: {
        exit: function(path, state) {
          return transform(path, state, true);
        }
      },
      ImportDeclaration: {
        exit: function(path, state) {
          return transform(path, state);
        }
      }
    }
  };
};
