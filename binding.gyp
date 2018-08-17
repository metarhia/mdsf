{
  'variables': {
    'mdsf_base_ccflags': [
      '-Wall',
      '-Wextra',
      '-Wno-unused-parameter',
      '-std=c++11'
    ],
    'mdsf_debug_ccflags': ['-g', '-O0'],
    'mdsf_release_ccflags': ['-O3'],
    'mdsf_use_short_unicode_tables': '<!(node ./tools/echo-env MDSF_USE_SHORT_UNICODE_TABLES)'
  },
  'targets': [
    {
      'target_name': 'mdsf',
      'sources': [
        'src/node_bindings.cc',
        'src/parser.cc',
        'src/message_parser.cc',
        'src/unicode_utils.cc'
      ],
      'conditions': [
        ['not mdsf_use_short_unicode_tables', {
          'defines': ['_PARSER_USE_FULL_TABLES_']
        }]
      ],
      'configurations': {
        'Debug': {
          'cflags_cc': ['<@(mdsf_debug_ccflags)'],
          'xcode_settings': {
            'OTHER_CPLUSPLUSFLAGS': ['<@(mdsf_debug_ccflags)']
          }
        },
        'Release': {
          'cflags_cc': ['<@(mdsf_release_ccflags)'],
          'xcode_settings': {
            'OTHER_CPLUSPLUSFLAGS': ['<@(mdsf_release_ccflags)']
          }
        }
      },
      'cflags_cc': ['<@(mdsf_base_ccflags)'],
      'xcode_settings': {
        'OTHER_CPLUSPLUSFLAGS': [
          '<@(mdsf_base_ccflags)',
          '-stdlib=libc++'
        ]
      }
    }
  ]
}
