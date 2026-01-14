import { Idl } from "@project-serum/anchor";

export const programId = 'G3X2RzKbyUTK3dQSHCozvbAAcs4MsdnUnbamFPnEeaW8';

export const IDL: Idl = {
    "version": "0.1.0",
    "name": "collateral_vault",
    "instructions": [
        {
            "name": "initializeVault",
            "accounts": [
                {
                    "name": "user",
                    "isMut": true,
                    "isSigner": true
                },
                {
                    "name": "vault",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "vaultTokenAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "usdtMint",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "tokenProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "associatedTokenProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "systemProgram",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": []
        },
        {
            "name": "deposit",
            "accounts": [
                {
                    "name": "user",
                    "isMut": true,
                    "isSigner": true
                },
                {
                    "name": "vault",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "userTokenAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "vaultTokenAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "tokenProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "associatedTokenProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "systemProgram",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": [
                {
                    "name": "amount",
                    "type": "u64"
                }
            ]
        },
        {
            "name": "withdraw",
            "accounts": [
                {
                    "name": "user",
                    "isMut": true,
                    "isSigner": true
                },
                {
                    "name": "vault",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "owner",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "userTokenAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "vaultTokenAccount",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "tokenProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "associatedTokenProgram",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "systemProgram",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": [
                {
                    "name": "amount",
                    "type": "u64"
                }
            ]
        },
        {
            "name": "lockCollateral",
            "accounts": [
                {
                    "name": "vault",
                    "isMut": true,
                    "isSigner": false
                }
            ],
            "args": [
                {
                    "name": "amount",
                    "type": "u64"
                }
            ]
        },
        {
            "name": "unlockCollateral",
            "accounts": [
                {
                    "name": "vault",
                    "isMut": true,
                    "isSigner": false
                }
            ],
            "args": [
                {
                    "name": "amount",
                    "type": "u64"
                }
            ]
        },
        {
            "name": "transferCollateral",
            "accounts": [
                {
                    "name": "fromOwner",
                    "isMut": true,
                    "isSigner": true
                },
                {
                    "name": "toOwner",
                    "isMut": false,
                    "isSigner": false
                },
                {
                    "name": "fromVault",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "toVault",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "systemProgram",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": [
                {
                    "name": "amount",
                    "type": "u64"
                }
            ]
        }
    ],
    "accounts": [
        {
            "name": "CollateralVault",
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "owner",
                        "type": "publicKey"
                    },
                    {
                        "name": "usdtMint",
                        "type": "publicKey"
                    },
                    {
                        "name": "tokenAccount",
                        "type": "publicKey"
                    },
                    {
                        "name": "totalBalance",
                        "type": "u64"
                    },
                    {
                        "name": "lockedBalance",
                        "type": "u64"
                    },
                    {
                        "name": "availableBalance",
                        "type": "u64"
                    },
                    {
                        "name": "totalDeposited",
                        "type": "u64"
                    },
                    {
                        "name": "totalWithdrawn",
                        "type": "u64"
                    },
                    {
                        "name": "createdAt",
                        "type": "i64"
                    },
                    {
                        "name": "bump",
                        "type": "u8"
                    }
                ]
            }
        }
    ],
    "events": [
        {
            "name": "DepositEvent",
            "fields": [
                {
                    "name": "user",
                    "type": "publicKey",
                    "index": false
                },
                {
                    "name": "amount",
                    "type": "u64",
                    "index": false
                },
                {
                    "name": "newBalance",
                    "type": "u64",
                    "index": false
                },
                {
                    "name": "timestamp",
                    "type": "i64",
                    "index": false
                }
            ]
        },
        {
            "name": "WithdrawEvent",
            "fields": [
                {
                    "name": "user",
                    "type": "publicKey",
                    "index": false
                },
                {
                    "name": "amount",
                    "type": "u64",
                    "index": false
                },
                {
                    "name": "timestamp",
                    "type": "i64",
                    "index": false
                }
            ]
        },
        {
            "name": "LockEvent",
            "fields": [
                {
                    "name": "vault",
                    "type": "publicKey",
                    "index": false
                },
                {
                    "name": "amount",
                    "type": "u64",
                    "index": false
                },
                {
                    "name": "timestamp",
                    "type": "i64",
                    "index": false
                }
            ]
        },
        {
            "name": "UnlockEvent",
            "fields": [
                {
                    "name": "vault",
                    "type": "publicKey",
                    "index": false
                },
                {
                    "name": "amount",
                    "type": "u64",
                    "index": false
                },
                {
                    "name": "timestamp",
                    "type": "i64",
                    "index": false
                }
            ]
        },
        {
            "name": "TransferEvent",
            "fields": [
                {
                    "name": "from",
                    "type": "publicKey",
                    "index": false
                },
                {
                    "name": "to",
                    "type": "publicKey",
                    "index": false
                },
                {
                    "name": "amount",
                    "type": "u64",
                    "index": false
                },
                {
                    "name": "timestamp",
                    "type": "i64",
                    "index": false
                }
            ]
        }
    ],
    "errors": [
        {
            "code": 6000,
            "name": "InvalidAmount",
            "msg": "Invalid amount"
        },
        {
            "code": 6001,
            "name": "InsufficientBalance",
            "msg": "Insufficient balance"
        },
        {
            "code": 6002,
            "name": "Unauthorized",
            "msg": "Unauthorized vault access"
        },
        {
            "code": 6003,
            "name": "InvalidRecipientVault",
            "msg": "Recipient vault is invalid or not initialized"
        }
    ]
}