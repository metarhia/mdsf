# JSTP / JavaScript Transfer Protocol

## Концепция

Это семейство форматов данных и соответствующих библиотек для работы с ними,
которые основаны на нескольких простых допущениях:
* передавать данные в виде JavaScript кода можно красивее и удобнее, чем в
формате сериализации JavaScript объектов JSON;
  - в самой простой реализации, это даже не потребует специального парсера,
  т.к. он уже встроен в передающую и принимающую системы;
  - человекочитаемый формат может быть почти таким же минималистичным, как
  бинарный, не многим ему уступая в эффективности кодирования, но сильно
  выигрывать от простоты просмотра пакетов;
  - формат сериализации и методика моделирования данных должены быть максимально
  однозначными и иметь понятные ответы на вопрос: почему именно так, а не иначе;
  - возможность применять различное форматирование и комментарии;
* передавать структуру вместе с данными каждый раз - это избыточно и нужно
оптимизировать формат сериализации и протокол, выделив метамодель и передавать
ее только если получающая система еще не имеет закешированной версии
метамодели;
* протокол взаимодействия между двумя JavaScript приложениями должен обладать
такими характеристиками: 
  - двусторонний асинхронный обмен данными с поддержкой множества параллельных
  (не блокирующих) взаимодействий и идентификаторов пакетов, позволяющих,
  например, установить соответствие между запросом и ответом;
  - поддержка вызова удаленных процедур RPC и множественных API интерфейсов
  должна быть настолько прозрачна, что приложения не должны знать, происходит
  ли вызов внутри адресного пространства приложения или запрос передан на
  удаленную систему для исполнения;
  - поддержка прямого вызова и ответа через `callback`;
  - поддержка трансляции именованных событий с прикрепленными к ним данными и
  именованных каналов для группировки событий;
  - поддержка автоматической синхронизации объектов в памяти приложений,
  специально зарегистрированых для синхронизации;
  - только одна из сторон может стать инициатором соединения, но обе стороны
  могут инициировать обмен данными по уже открытому каналу;
  - транспортный уровень должен обеспечивать надежную передачу данных с
  установкой соединения и гарантированной доставкой (TCP базовый транспорт, но
  мы не ограничиваемся им и может быть использован аналог для передачи данных
  через RS232, USB или Websocket);
  - все типы пакетов (вызов, ответ, колбэек, событие и данные) могут быть
  разделены на несколько частей, если тело прикрепленных данных слишком большое;
  - необходима возможность прекратить передачу данных, если данные, передаваемые
  по частям, слишком большие и еще не получена последняя их часть;
* необходимо минимизировать преобразование данных при передаче между системами,
хранении и обработке, минимизировать перекладывание из одних структур в другие,
экономить память и канал связи;
* количество структур данных, необходимых для работы большинства систем является
конечным, а сами структуры должны стать фактическими стандартами в результате
консенсуса специалистов с возможностью их версионного изменения;
* нестандартизированные структуры данных могут передаваться между системами,
снабженные метаданными, которые позволяют их интерпретировать и до известной
степени обеспечить универсальную обработку, если удаленные стороны доверяют друг
другу, а формализация данных не имеет смысла;

## Структура семейства форматов

* [Record Serialization](#record-serialization)
`{ name: 'Marcus Aurelius', passport: 'AE127095' }`
* [Object Serialization](#object-serialization)
`{ name: ['Marcus', 'Aurelius'].join(' '), passport: 'AE' + '127095' }`
* [Record Metadata](#record-metadata)
`{ name: 'string', passport: '[string]' }`
* [Record Data](#record-data)
`[ 'Marcus Aurelius', 'AE127095' ]`
* [JavaScript Transfer Protocol](#javascript-transfer-protocol)
`{ event: [17, 'accounts'], insert: ['Marcus Aurelius', 'AE127095'] }`

## Record Serialization

Это просто JavaScript описывающий структуру данных. В отличие от JSON в нем
не нужно помещать ключи в двойные кавычки, можно вставлять комментарии, гибко
форматировать и все остальное, что можно в обычном JavaScript. Например:
```JavaScript
{
  name: 'Marcus Aurelius',
  passport: 'AE127095',
  birth: {
    date: '1990-02-15',
    place: 'Rome'
  },
  contacts: {
    email: 'marcus@aurelius.it',
    phone: '+380505551234',
    address: {
      country: 'Ukraine',
      city: 'Kiev',
      zip: '03056',
      street: 'Pobedy',
      building: '37',
      floor: '1',
      room: '158'
    }
  }
}
```

Самый простой способ распарсить этот формат на Node.js:
```JavaScript
api.jstp.parse = function(s) {
  var sandbox = vm.createContext({});
  var js = vm.createScript('(' + s + ')');
  return js.runInNewContext(sandbox);
};
```
А вот пример его использования:
```JavaScript
fs.readFile('./person.record', function(err, s) {
  var person = api.jstp.parse(s);
  console.dir(person);
});
```

## Object Serialization

Если немного усложнить парсер, перекладывая все ключи, которые он экспортирует
к нему же в песочницу, то можно будет использовать выражения, вызовы функции и
определения функций:
```JavaScript
api.jstp.parse = function(s) {
  var sandbox = vm.createContext({});
  var js = vm.createScript('(' + s + ')');
  var exported = js.runInNewContext(sandbox);
  for (var key in exported) {
    sandbox[key] = exported[key];
  }
  return exported;
};
```
Пример данных:
```JavaScript
{
  name: ['Marcus', 'Aurelius'].join(' '),
  passport: 'AE' + '127095',
  birth: {
    date: new Date('1990-02-15'),
    place: 'Rome'
  },
  age: function() {
    var difference = new Date() - birth.date;
    return Math.floor(difference / 31536000000);
  }
}
```
Из примера видно, в функциях можно использовать ссылки на поля структуры,
например: `birth.date`.

А вот пример его использования:
```JavaScript
fs.readFile('./person.record', function(err, s) {
  var person = api.jstp.parse(s);
  console.log('Age = ' + person.age());
});
```

## Record Metadata

Это метаданные, т.е. данные о структуре и типах данных, описанные в том же
формате JavaScript объектов. Определения полей описываются при помощи
специального синтаксиса. Например: `number(4)` это число, имеющее не более 4
разрядов и поле не может принимать `undefined`, а `[number(2,4)]` это число от
2 до 4 разрядов или `undefined`. Еще примеры:

```JavaScript
// Файл: Person.metadata
{
  name: 'string',
  passport: '[string(8)]',
  birth: '[Birth]',
  address: '[Address]'
}

// Файл: Birth.metadata
{
  date: 'Date',
  place: '[string]'
}

// Файл: Address.metadata
{
  country: 'string',
  city: 'string',
  zip: 'number(5)',
  street: 'string',
  building: 'string',
  room: '[number]'
}
```

Имена типов начинаются с маленькой буквы: `string`, `number`, `boolean`, а
ссылки на другие записи начинаются с большой: `Birth`, `Address`. Все описания
записей хранятся в специальном хранилище структур и могут кешироваться на
серверах и пользовательских устройствах.

## Record Data

Это чистые данные, из которых удалены все имена полей, а хеши заменены на
массивы. Если поле не имеет значения, т.е. `undefined`, то значение в массиве
просто пропущено. Например: `[1,,,4]` - это 4 поля, первое и последнее имеют
значения `1` и `4` соответственно, а второе и третье равны `undefined`.

Пример экземпляра записи `Person`:
```JavaScript
['Marcus Aurelius','AE127095',['1990-02-15','Rome'],['Ukraine','Kiev','03056','Pobedy','37','158']]
```

Если мы имеем данные и соответствующие метаданные, то можем развернуть из них
полный документ. Например:
```JavaScript
var data = ['Marcus Aurelius','AE127095'];
var metadata = { name: 'string', passport: '[string(8)]' };
var person = api.jstp.decode(data, metadata);
console.dir(person);
{ name: 'Marcus Aurelius', passport: 'AE127095' }
```

## JavaScript Transfer Protocol

JSTP это протокол передачи данных, использующий в качестве формата кодирования
данных синтаксис JavaScript объектов и поддерживающий метаданные. Протокол имеет
8 типов пакетов:
* `call` — вызов метода удаленного API
* `callback` — ответ удаленного API
* `event` — событие с прикрепленными к нему данными
* `state` — синхронизация данных
* `stream` — передача потока данных
* `handshake` — рукопожатие
* `health` — служебные данные о состоянии и использовании ресурсов
* `inspect` — получение интроспекции API
* предполагается расширение типов пакетов

```JavaScript
// Номер пакета 17, вызов, имя интерфейса auth, метод newAccount
{call:[17,'auth'],newAccount:['Payload data']}

// Ответ на пакет 17, результат done, идентификатор записи 15703
{callback:[17],ok:[15703]}

// Событие в пакете 18, интерфейс auth, имя события insert
{event:[18,'auth'],insert:['Marcus Aurelius','AE127095']}
```

Структура пакета:
- пакет это объект, с несколькими ключами;
- первый ключ - это заголовок, имя ключа - тип пакета; его элементы:
  - `[0]` - номер пакета, идентифицирующий его в рамкаж соединения; пакет с
  идентификатором `0` отправляет клиент (тот, кто инициировал установление
  соединения) и начинает инкрементировать его на `1` в каждом следующем зпросе
  от клиента; сервер имеет отдельный счетчик, он декрементирует его на `1` с
  каждым запросом; если любая из сторон посылает запрос (пакет типа `call`),
  то противоположная отвечает на него пакетом типа `callback` с тем же
  идентификатором;
  - `[1]` - идентификатор:
    - в запросах `call`, `event` и `inspect` - идентификатор (имя) интерфейса;
    - в запросе `state` - идентификатор изменяемого объекта (путь к нему);
- второй ключ - идентификатор:
  - в запросе `call` - идентификатор метода;
  - в запросе `callback` - идентификатор статусв ответа: `ok` или `error`;
  - в запросе `event` - идентификатор (имя) события;
  - в запросе `state` - идентификатор метода: `inc`, `dec`, `delete`, `let`,
  `push`, `pop`, `shift`, `unshift`;
  - в запросе `inspect` - нет значения;
  - в запросе `stream` - нет значения

### Пакет вызова call

Примеры:
```JavaScript
{call:[3,'interfaceName'],methodName:['Payload data']}
```

### Пакет обратного вызова callback

Примеры:
```JavaScript
{callback:[14],ok:[15703]}

{callback:[397],error:[4,'Data validation failed']}

{callback:[-23],ok:[]}
```

### Пакет события event

Примеры:
```JavaScript
{event:[-12,'chat'],message:['Marcus','Hello there!']}

{event:[51,'game'],vote:[5]}

{event:[-79,'db'],insert:['Marcus','Aurelius','Rome','AE127095']}
```

### Пакет синхронизации данных state

Примеры:
```JavaScript
{state:[-12,'object.path.prop1'],inc:5}
{state:[-13,'object.path.prop2'],dec:1}
{state:[-14,'object.path.prop3'],let:700}
{state:[-15,'object.path.prop4'],let:'Hello'}
{state:[-16,'object.path.prop5'],let:{f:55}}
{state:[-17,'object.path.prop5'],let:[1,2,7]}
{state:[-18,'object.path.prop6'],delete:0}
{state:[-19,'object.path.set1'],let:['A','D']}
{state:[-20,'object.path.set1'],push:'C'}
{state:[-20,'object.path.set2'],let:[5,6,9]}
{state:[-20,'object.path.set2'],push:12}
{state:[-20,'object.path.set2'],pop:2}
{state:[-20,'object.path.set2'],shift:3}
{state:[-20,'object.path.set2'],delete:5}
{state:[-20,'object.path.set2'],unshift:1}
```

### Пакет потока данных stream

Примеры:
```JavaScript
{stream:[9],data:'Payload start...'}
{stream:[9],data:'...continue...'}
{stream:[9],data:'...end'}
```

### Пакет рукопожатия handshake

Для пакетов рукопожатия номер пакета всегда `0`. Ответ содержит или ключ `ok` со значением - идентификатором сессии или `error` - массив с кодом ошибки и опциональным текстовым сообщением об ошибке.

Удачное рукопожатие при подключении клиента:
```JavaScript
C: {handshake:[0,'example'],marcus:'7b458e1a9dda....67cb7a3e'}
S: {handshake:[0],ok:'9b71d224bd62...bcdec043'}
```
Тут `example` это applicationName - имя приложения, `marcus` - имя пользователя, а `9b71d224bd62...bcdec043` - это идентификатор сессии.

Удачное рукопожатие при подключении клиента под анонимным аккаунтом:
```JavaScript
C: {handshake:[0,'example']}
S: {handshake:[0],ok:'f3785d96d46a...def46f73'}
```
Это может быть необходимо для регистрации или публичного сервиса. Сервер возвращает `f3785d96d46a...def46f73` - это идентификатор сессии.

Удачное рукопожатие при подключении воркера Impress к контроллеру приватного облака:
```JavaScript
C: {handshake:[0,'impress'],S1N5:'d3ea3d73319b...5c2e5c3a'}
S: {handshake:[0],ok:'PrivateCloud'}
```
Тут `PrivateCloud` это cloudName - имя приватного облака, а `d3ea3d73319b...5c2e5c3a` ключа облака (не хеш).

Приложение не найдено:
```JavaScript
C: {handshake:[0,'example'],marcus:'fbc2890caada...0c466347'}
S: {handshake:[0],error:[10,'Application not found']}
```
Тут `marcus` это имя пользователя, а `fbc2890caada...0c466347` это хеш пароля `sha512` с солью.

Ошибка аутентификации:
```JavaScript
C: {handshake:[0,'example'],marcus:'e2dff7251967...14b8c5da'}
S: {handshake:[0],error:[11,'Authentication failed']}
```

### Пакет запроса интроспекции inspect

Данный пакет передаётся для запроса интроспекции методов интерфейса на сервере
или клиенте, и, соответственно, может передаваться любой стороной.

Аналогично пакету `call`, обратная сторона отвечает на запрос пакетом `callback`.

Пример удачного получения интроспекции:

```javascript
C: {inspect:[42,'interfaceName']}
S: {callback:[42],ok:['method1','method2']}
```

Пример ошибки получения интроспекции:

```javascript
C: {inspect:[15,'unknownInterface']}
S: {callback:[15],error:[12,'Interface not found']}
```

### Передача данных

Протокол TCP передает поток данных, поэтому последовательно переданные фрагменты
склеиваются и разрезаются протоколом в произвольном месте. Для разделения потока
на отдельные сообщения мы должны ввести или указание длины фрагментов или
терминаторы сообщений. В JSTP используется терминатор, позволяющий очень
эффективно накапливать и разбирать буфер получаемых данных. Терминатор `,{\f},`
выбран так, чтоб он не мог встретиться внутри пакетов сериализации JSTP (символ
`\f` с кодом `0C`).

В начало буфера мы всегда пишем `[`, потом дописываем блоки, приходящие из
сокета, а как только детектируем, что буфер заканчивается на `,{\f},`, то можно
добавит `]` и отправить на парсинг в `api.jstp.parser()`.

Например, вот сформированный буфер с двумя сообщениями:
```JavaScript
[{call:[-3,'test'],signal:['A']},{\f},{event:[-4,'chat'],message:['Hi']},{\f},
```

### Ссылки на реализации

* For node.js and Impress Application Server [Impress/lib/api.jstp.js](https://github.com/metarhia/Impress/blob/master/lib/api.jstp.js)
* For C++ [NechaiDO/JSTP-cpp](https://github.com/NechaiDO/JSTP-cpp) and for Qt [NechaiDO/QJSTP](https://github.com/NechaiDO/QJSTP)
* For iOS & Swift [JSTPMobile/iOS](https://github.com/JSTPMobile/iOS)
* For Java [JSTPMobile/Java](https://github.com/JSTPMobile/Java)
* For C# [JSTPKPI/JSTP-CS](https://github.com/JSTPKPI/JSTP-CS)
* For Python [mitchsvik/JSTP-Python](https://github.com/mitchsvik/JSTP-Python)
* For Haskell [DzyubSpirit/JSTPHaskellParser](https://github.com/DzyubSpirit/JSTPHaskellParser)
* For PHP [Romm17/JSTPParserInPHP](https://github.com/Romm17/JSTPParserInPHP)
* For GoLang [belochub/jstp-go](https://github.com/belochub/jstp-go)
