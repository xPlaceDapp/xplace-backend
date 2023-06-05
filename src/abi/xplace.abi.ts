export default {
  buildInfo: {
    rustc: {
      version: '1.68.0-nightly',
      commitHash: 'afaf3e07aaa7ca9873bdb439caec53faffa4230c',
      commitDate: '2023-01-14',
      channel: 'Nightly',
      short: 'rustc 1.68.0-nightly (afaf3e07a 2023-01-14)'
    },
    contractCrate: {
      name: 'xplace',
      version: '0.0.0'
    },
    framework: {
      name: 'multiversx-sc',
      version: '0.39.8'
    }
  },
  name: 'XPlaceContract',
  constructor: {
    inputs: [
      {
        name: 'grid_size',
        type: 'u64'
      }
    ],
    outputs: []
  },
  endpoints: [
    {
      name: 'changePixelColor',
      mutability: 'mutable',
      payableInTokens: [
        'EGLD'
      ],
      inputs: [
        {
          name: 'x',
          type: 'u64'
        },
        {
          name: 'y',
          type: 'u64'
        },
        {
          name: 'color',
          type: 'PixelColor'
        }
      ],
      outputs: []
    },
    {
      name: 'setUserAffiliation',
      mutability: 'mutable',
      inputs: [
        {
          name: 'sponsor_id',
          type: 'u64'
        }
      ],
      outputs: []
    },
    {
      name: 'getPixels',
      mutability: 'readonly',
      inputs: [
        {
          name: 'from_x',
          type: 'u64'
        },
        {
          name: 'from_y',
          type: 'u64'
        },
        {
          name: 'size',
          type: 'u64'
        }
      ],
      outputs: [
        {
          type: 'List<GetPixelInfos>'
        }
      ]
    },
    {
      name: 'getPixelPrice',
      mutability: 'readonly',
      inputs: [
        {
          name: 'played_count',
          type: 'u64'
        }
      ],
      outputs: [
        {
          type: 'BigUint'
        }
      ]
    },
    {
      name: 'getGridSize',
      mutability: 'readonly',
      inputs: [],
      outputs: [
        {
          type: 'u64'
        }
      ]
    },
    {
      name: 'getSponsor',
      mutability: 'readonly',
      inputs: [
        {
          name: 'id',
          type: 'u64'
        }
      ],
      outputs: [
        {
          type: 'Address'
        }
      ]
    },
    {
      name: 'getLastSponsorId',
      mutability: 'readonly',
      inputs: [],
      outputs: [
        {
          type: 'u64'
        }
      ]
    },
    {
      name: 'getAffiliatedSponsorByUser',
      mutability: 'readonly',
      inputs: [
        {
          name: 'user',
          type: 'Address'
        }
      ],
      outputs: [
        {
          type: 'u64'
        }
      ]
    },
    {
      name: 'addSponsor',
      onlyOwner: true,
      mutability: 'mutable',
      inputs: [
        {
          name: 'sponsor_address',
          type: 'Address'
        }
      ],
      outputs: []
    },
    {
      name: 'editSponsor',
      onlyOwner: true,
      mutability: 'mutable',
      inputs: [
        {
          name: 'sponsor_id',
          type: 'u64'
        },
        {
          name: 'new_sponsor_address',
          type: 'Address'
        }
      ],
      outputs: []
    },
    {
      name: 'removeSponsor',
      onlyOwner: true,
      mutability: 'mutable',
      inputs: [
        {
          name: 'sponsor_id',
          type: 'u64'
        }
      ],
      outputs: []
    }
  ],
  events: [
    {
      identifier: 'pixelChanged',
      inputs: [
        {
          name: 'coordinates',
          type: 'tuple<u64,u64>',
          indexed: true
        },
        {
          name: 'data',
          type: 'PixelInfos'
        }
      ]
    }
  ],
  hasCallback: false,
  types: {
    GetPixelInfos: {
      type: 'struct',
      fields: [
        {
          name: 'x',
          type: 'u64'
        },
        {
          name: 'y',
          type: 'u64'
        },
        {
          name: 'pixel_infos',
          type: 'PixelInfos'
        }
      ]
    },
    PixelColor: {
      type: 'enum',
      variants: [
        {
          name: 'Red',
          discriminant: 0
        },
        {
          name: 'Blue',
          discriminant: 1
        },
        {
          name: 'Yellow',
          discriminant: 2
        },
        {
          name: 'Purple',
          discriminant: 3
        },
        {
          name: 'White',
          discriminant: 4
        },
        {
          name: 'Black',
          discriminant: 5
        }
      ]
    },
    PixelInfos: {
      type: 'struct',
      fields: [
        {
          name: 'address',
          type: 'Address'
        },
        {
          name: 'color',
          type: 'PixelColor'
        },
        {
          name: 'played_count',
          type: 'u64'
        }
      ]
    }
  }
}
