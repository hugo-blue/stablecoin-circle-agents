// CDP Facilitator address pool (25 rotating Base addresses)
// Discovered by the x402scan community via open-source reverse engineering:
// https://github.com/Merit-Systems/x402scan/blob/main/packages/external/facilitators/src/facilitators/coinbase.ts

export const BASE_USDC_CONTRACT = '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913'

export const CDP_FACILITATOR_ADDRESSES = [
  '0xdbdf3d8ed80f84c35d01c6c9f9271761bad90ba6', // earliest, active since 2025-05-05
  '0x9aae2b0d1b9dc55ac9bab9556f9a26cb64995fb9',
  '0x3a70788150c7645a21b95b7062ab1784d3cc2104',
  '0x708e57b6650a9a741ab39cae1969ea1d2d10eca1',
  '0xce82eeec8e98e443ec34fda3c3e999cbe4cb6ac2',
  '0x7f6d822467df2a85f792d4508c5722ade96be056',
  '0x001ddabba5782ee48842318bd9ff4008647c8d9c',
  '0x9c09faa49c4235a09677159ff14f17498ac48738',
  '0xcbb10c30a9a72fae9232f41cbbd566a097b4e03a',
  '0x9fb2714af0a84816f5c6322884f2907e33946b88',
  '0x47d8b3c9717e976f31025089384f23900750a5f4',
  '0x94701e1df9ae06642bf6027589b8e05dc7004813',
  '0x552300992857834c0ad41c8e1a6934a5e4a2e4ca',
  '0xd7469bf02d221968ab9f0c8b9351f55f8668ac4f',
  '0x88800e08e20b45c9b1f0480cf759b5bf2f05180c',
  '0x6831508455a716f987782a1ab41e204856055cc2',
  '0xdc8fbad54bf5151405de488f45acd555517e0958',
  '0x91d313853ad458addda56b35a7686e2f38ff3952',
  '0xadd5585c776b9b0ea77e9309c1299a40442d820f',
  '0x4ffeffa616a1460570d1eb0390e264d45a199e91',
  '0x8f5cb67b49555e614892b7233cfddebfb746e531',
  '0x67b9ce703d9ce658d7c4ac3c289cea112fe662af',
  '0x68a96f41ff1e9f2e7b591a931a4ad224e7c07863',
  '0x97acce27d5069544480bde0f04d9f47d7422a016',
  '0xa32ccda98ba7529705a059bd2d213da8de10d101',
] as const
