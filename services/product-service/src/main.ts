import 'reflect-metadata'
import dataSource from './db'
import { Server, ServerCredentials } from '@grpc/grpc-js'
import { getProductServer } from './server'
import { ProductServiceService } from '@grpc-node-server/protos/dist/product/product'
import { ReflectionService } from '@grpc/reflection'
import * as protoLoader from '@grpc/proto-loader'
import * as path from 'path'

// プロトコル定義のパス
const PROTO_PATH = path.resolve(
  __dirname,
  '../../../packages/protos/src/product/product.proto'
)

// プロトコル定義をロード
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
})

const server = new Server()

// サービスを追加
server.addService(ProductServiceService, getProductServer(dataSource))

// リフレクションサービスを作成し、サーバーに追加
const reflection = new ReflectionService(packageDefinition)
reflection.addToServer(server)

const HOST = process.env.HOST || '0.0.0.0'
const PORT = Number(process.env.PORT) || 50052

const address = `${HOST}:${PORT}`

dataSource
  .initialize()
  .then(() => {
    server.bindAsync(
      address,
      ServerCredentials.createInsecure(),
      (error, port) => {
        if (error) {
          console.error('Failed to bind server:', error)
          return
        }
        console.log('Server is running on', port)
        server.start()
      }
    )
  })
  .catch((error) => console.log(error))
