/*
 * libmedia AVTranscoder
 *
 * 版权所有 (C) 2024 赵高兴
 * Copyright (C) 2024 Gaoxing Zhao
 *
 * 此文件是 libmedia 的一部分
 * This file is part of libmedia.
 * 
 * libmedia 是自由软件；您可以根据 GNU Lesser General Public License（GNU LGPL）3.1
 * 或任何其更新的版本条款重新分发或修改它
 * libmedia is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 3.1 of the License, or (at your option) any later version.
 * 
 * libmedia 希望能够为您提供帮助，但不提供任何明示或暗示的担保，包括但不限于适销性或特定用途的保证
 * 您应自行承担使用 libmedia 的风险，并且需要遵守 GNU Lesser General Public License 中的条款和条件。
 * libmedia is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 */

import { AVCodecID, AVMediaType } from 'avutil/codec'
import IOPipeline, { IOType } from 'avpipeline/IOPipeline'
import DemuxPipeline from 'avpipeline/DemuxPipeline'
import VideoDecodePipeline from 'avpipeline/VideoDecodePipeline'
import AudioDecodePipeline from 'avpipeline/AudioDecodePipeline'
import { Thread, closeThread, createThreadFromClass } from 'cheap/thread/thread'
import generateUUID from 'common/function/generateUUID'
import * as is from 'common/util/is'
import * as object from 'common/util/object'
import { AVPacketRef } from 'avutil/struct/avpacket'
import List from 'cheap/std/collection/List'
import { AVFrameRef } from 'avutil/struct/avframe'
import { Mutex } from 'cheap/thread/mutex'
import compile, { WebAssemblyResource } from 'cheap/webassembly/compiler'
import { AVFormat } from 'avformat/avformat'
import * as urlUtils from 'common/util/url'
import * as cheapConfig from 'cheap/config'
import * as logger from 'common/util/logger'
import support from 'common/util/support'
import browser from 'common/util/browser'
import { avQ2D, avRescaleQ } from 'avutil/util/rational'
import { AV_MILLI_TIME_BASE_Q, NOPTS_VALUE } from 'avutil/constant'
import { mapSafeUint8Array, memcpyFromUint8Array } from 'cheap/std/memory'
import getVideoCodec from 'avcodec/function/getVideoCodec'
import * as mutex from 'cheap/thread/mutex'
import { IOFlags } from 'common/io/flags'
import AudioEncodePipeline from 'avpipeline/AudioEncodePipeline'
import VideoEncodePipeline from 'avpipeline/VideoEncodePipeline'
import IOReader from 'common/io/IOReader'
import { AudioCodecString2CodecId, Ext2Format, Ext2IOLoader, Format2AVFormat, PixfmtString2AVPixelFormat, SampleFmtString2SampleFormat, VideoCodecString2CodecId } from 'avutil/stringEnum'
import MuxPipeline from 'avpipeline/MuxPipeline'
import IOWriterSync from 'common/io/IOWriterSync'
import { AVStreamInterface } from 'avpipeline/interface'
import Stats from 'avpipeline/struct/stats'
import IPCPort, { NOTIFY, REQUEST, RpcMessage } from 'common/network/IPCPort'
import * as errorType from 'avutil/error'
import getAudioCodec from 'avcodec/function/getAudioCodec'
import { avFree, avMalloc, avMallocz } from 'avutil/util/mem'
import AVCodecParameters from 'avutil/struct/avcodecparameters'
import { copyCodecParameters, freeCodecParameters } from 'avutil/util/codecparameters'
import { Rational } from 'avutil/struct/rational'
import SafeFileIO from 'common/io/SafeFileIO'
import Emitter from 'common/event/Emitter'
import * as eventType from './eventType'
import { BitFormat } from 'avformat/codecs/h264'
import { unrefAVFrame } from 'avutil/util/avframe'
import { unrefAVPacket } from 'avutil/util/avpacket'

import * as aac from 'avformat/codecs/aac'
import * as opus from 'avformat/codecs/opus'
import * as h264 from 'avformat/codecs/h264'
import * as hevc from 'avformat/codecs/hevc'
import * as vvc from 'avformat/codecs/vvc'
import * as av1 from 'avformat/codecs/av1'
import * as vp9 from 'avformat/codecs/vp9'
import Sleep from 'common/timer/Sleep'
import AVFilterPipeline from './filter/AVFilterPipeline'
import { createGraphDesVertex } from './filter/graph'
import { AVSampleFormat } from 'avutil/audiosamplefmt'
import { AVPixelFormat } from 'avutil/pixfmt'

export interface AVTranscoderOptions {
  getWasm: (type: 'decoder' | 'resampler' | 'scaler' | 'encoder', codec?: AVCodecID) => string | ArrayBuffer | WebAssemblyResource
  enableHardware?: boolean
}

export interface TaskOptions {
  input: {
    file: string | File | IOReader
    format?: keyof (typeof Format2AVFormat)
    protocol?: 'hls' | 'dash'
  }
  start?: number
  duration?: number
  nbFrame?: number
  output: {
    file: FileSystemFileHandle | IOWriterSync
    format?: keyof (typeof Format2AVFormat)
    video?: {
      /**
       * 输出编码类型
       */
      codec?: keyof (typeof VideoCodecString2CodecId)
      /**
       * 是否不输出
       */
      disable?: boolean
      /**
       * 输出宽度
       */
      width?: number  
      /**
       * 输出高度
       */
      height?: number
      /**
       * 输出帧率
       */
      framerate?: number
      /**
       * 输出码率
       */
      bitrate?: number
      /**
       * 输出视频高宽比
       */
      aspect?: {
        den: number
        num: number
      }
      /**
       * 输出像素格式
       */
      pixfmt?: keyof (typeof PixfmtString2AVPixelFormat)
      /**
       * 输出关键帧间隔(毫秒)
       */
      keyFrameInterval?: number

      profile?: number
      level?: number
      delay?: number
    }
    audio?: {
      /**
       * 输出编码类型
       */
      codec?: keyof (typeof AudioCodecString2CodecId)
      /**
       * 是否不输出
       */
      disable?: boolean
      /**
       * 输出声道数
       */
      channels?: number
      /**
       * 输出采样率
       */
      sampleRate?: number
      /**
       * 输出码率
       */
      bitrate?: number
      /**
       * 输出采样格式
       */
      sampleFmt?: keyof (typeof SampleFmtString2SampleFormat)

      profile?: number
    }
  }
}

interface SelfTask {
  taskId: string
  subTaskId?: string
  ext?: string
  options: TaskOptions
  ioloader2DemuxerChannel: MessageChannel
  muxer2OutputChannel: MessageChannel
  stats: Stats
  inputIPCPort?: IPCPort
  outputIPCPort?: IPCPort
  safeFileIO?: SafeFileIO
  format: AVFormat
  streams: {
    taskId?: string
    input: AVStreamInterface
    output?: AVStreamInterface
    demuxer2DecoderChannel?: MessageChannel
    decoder2EncoderChannel?: MessageChannel
    decoder2FilterChannel?: MessageChannel
    filter2EncoderChannel?: MessageChannel
    encoder2MuxerChannel?: MessageChannel
    demuxer2MuxerChannel?: MessageChannel
  }[]
}

@struct
class AVTranscoderGlobalData {
  avpacketList: List<pointer<AVPacketRef>>
  avframeList: List<pointer<AVFrameRef>>
  avpacketListMutex: Mutex
  avframeListMutex: Mutex
}

const defaultAVTranscoderOptions: Partial<AVTranscoderOptions> = {
  enableHardware: true
}

export default class AVTranscoder extends Emitter {

  private level: number = logger.INFO

  private DemuxThreadReady: Promise<void>
  private AudioThreadReady: Promise<void>
  private VideoThreadReady: Promise<void>
  private MuxThreadReady: Promise<void>

  // 下面的线程所有 AVPlayer 实例共享
  private IOThread: Thread<IOPipeline>
  private DemuxerThread: Thread<DemuxPipeline>
  private MuxThread: Thread<MuxPipeline>

  private AudioDecoderThread: Thread<AudioDecodePipeline>
  private AudioFilterThread: Thread<AVFilterPipeline>
  private AudioEncoderThread: Thread<AudioEncodePipeline>

  private VideoDecoderThread: Thread<VideoDecodePipeline>
  private VideoFilterThread: Thread<AVFilterPipeline>
  private VideoEncoderThread: Thread<VideoEncodePipeline>

  // AVTranscoder 各个线程间共享的数据
  private GlobalData: AVTranscoderGlobalData

  private tasks: Map<string, SelfTask>
  private options: AVTranscoderOptions

  constructor(options: AVTranscoderOptions) {
    super(true)
    this.options = object.extend({}, defaultAVTranscoderOptions, options)

    this.GlobalData = make(AVTranscoderGlobalData)
    
    mutex.init(addressof(this.GlobalData.avpacketListMutex))
    mutex.init(addressof(this.GlobalData.avframeListMutex))
    this.tasks = new Map()

    logger.info(`create transcoder`)
  }

  private async startDemuxPipeline() {
    if (this.DemuxThreadReady) {
      return this.DemuxThreadReady
    }
    return this.DemuxThreadReady = new Promise(async (resolve) => {
      this.IOThread = await createThreadFromClass(IOPipeline, {
        name: 'IOThread'
      }).run()
      this.IOThread.setLogLevel(this.level)

      this.DemuxerThread = await createThreadFromClass(DemuxPipeline, {
        name: 'DemuxerThread'
      }).run()
      this.DemuxerThread.setLogLevel(this.level)
      resolve()
    })
  }

  private async startVideoPipeline() {
    if (this.VideoThreadReady) {
      return this.VideoThreadReady
    }
    return this.VideoThreadReady = new Promise(async (resolve) => {
      this.VideoDecoderThread = await createThreadFromClass(VideoDecodePipeline, {
        name: 'VideoDecoderThread',
        disableWorker: browser.safari && !browser.checkVersion(browser.version, '16.1', true)
      }).run()
      this.VideoDecoderThread.setLogLevel(this.level)

      this.VideoFilterThread = await createThreadFromClass(AVFilterPipeline, {
        name: 'VideoFilterThread',
        disableWorker: browser.safari && !browser.checkVersion(browser.version, '16.1', true)
      }).run()
      this.VideoFilterThread.setLogLevel(this.level)

      this.VideoEncoderThread = await createThreadFromClass(VideoEncodePipeline, {
        name: 'VideoEncoderThread',
        disableWorker: browser.safari && !browser.checkVersion(browser.version, '16.1', true)
      }).run()
      this.VideoEncoderThread.setLogLevel(this.level)
      resolve()
    })
  }

  private async startAudioPipeline() {
    if (this.AudioThreadReady) {
      return this.AudioThreadReady
    }
    return this.AudioThreadReady = new Promise(async (resolve) => {
      this.AudioDecoderThread = await createThreadFromClass(AudioDecodePipeline, {
        name: 'AudioDecoderThread',
        disableWorker: browser.safari && !browser.checkVersion(browser.version, '16.1', true)
      }).run()
      this.AudioDecoderThread.setLogLevel(this.level)

      this.AudioFilterThread = await createThreadFromClass(AVFilterPipeline, {
        name: 'AudioFilterThread',
        disableWorker: browser.safari && !browser.checkVersion(browser.version, '16.1', true)
      }).run()
      this.AudioFilterThread.setLogLevel(this.level)

      this.AudioEncoderThread = await createThreadFromClass(AudioEncodePipeline, {
        name: 'AudioEncoderThread',
        disableWorker: browser.safari && !browser.checkVersion(browser.version, '16.1', true)
      }).run()
      this.AudioEncoderThread.setLogLevel(this.level)
      resolve()
    })
  }

  private async startMuxPipeline() {
    if (this.MuxThreadReady) {
      return this.MuxThreadReady
    }
    return this.MuxThreadReady = new Promise(async (resolve) => {
      this.MuxThread = await createThreadFromClass(MuxPipeline, {
        name: 'MuxThread',
        disableWorker: !support.workerMSE
      }).run()
      this.MuxThread.setLogLevel(this.level)
      resolve()
    })
  }

  private isHls(task: SelfTask) {
    if (task.ext) {
      return task.ext === 'm3u8' || task.ext === 'm3u'
    }
    return task.options.input.protocol === 'hls' 
  }

  private isDash(task: SelfTask) {
    if (task.ext) {
      return task.ext === 'mpd'
    }
    return task.options.input.protocol === 'dash' 
  }

  public async ready() {
    await this.startDemuxPipeline()
    await this.startAudioPipeline()
    await this.startVideoPipeline()
    await this.startMuxPipeline()
    logger.info('AVTranscoder pipelines started')
  }

  private copyAVStreamInterface(stream: AVStreamInterface) {
    const newStream = object.extend({}, stream)
    newStream.codecpar = avMallocz(sizeof(AVCodecParameters))
    copyCodecParameters(newStream.codecpar, stream.codecpar)
    newStream.timeBase = avMallocz(sizeof(Rational))
    newStream.timeBase.den = stream.timeBase.den
    newStream.timeBase.num = stream.timeBase.num

    if (newStream.codecpar.extradata) {
      avFree(newStream.codecpar.extradata)
      newStream.codecpar.extradata = nullptr
      newStream.codecpar.extradataSize = 0
    }

    return newStream
  }

  private async setTaskInput(task: SelfTask) {
    const taskId = task.taskId
    const taskOptions = task.options
    const ioloader2DemuxerChannel = task.ioloader2DemuxerChannel = new MessageChannel()
    const stats = task.stats

    let ret = 0
    let ext: string
    if (is.string(taskOptions.input.file)) {
      ext = urlUtils.parse(taskOptions.input.file).file.split('.').pop()
      // 注册一个 url io 任务
      ret = await this.IOThread.registerTask
        .transfer(ioloader2DemuxerChannel.port1)
        .invoke({
          type: Ext2IOLoader[ext] ?? IOType.Fetch,
          info: {
            url: taskOptions.input.file
          },
          range: {
            from: -1,
            to: -1
          },
          taskId,
          options: {
            isLive: false
          },
          rightPort: ioloader2DemuxerChannel.port1,
          stats: addressof(stats)
        })
    }
    else if (taskOptions.input.file instanceof File) {
      ext = taskOptions.input.file.name.split('.').pop()
      // 注册一个文件 io 任务
      ret = await this.IOThread.registerTask
        .transfer(ioloader2DemuxerChannel.port1)
        .invoke({
          type: IOType.File,
          info: {
            file: taskOptions.input.file
          },
          range: {
            from: -1,
            to: -1
          },
          taskId,
          options: {
            isLive: false
          },
          rightPort: ioloader2DemuxerChannel.port1,
          stats: addressof(stats)
        })
    }
    else {
      const ipcPort = task.inputIPCPort = new IPCPort(ioloader2DemuxerChannel.port1)
      ipcPort.on(REQUEST, async (request: RpcMessage) => {
        switch (request.method) {
          case 'open': {
            ipcPort.reply(request, {})
            break
          }
          case 'read': {
            const pointer = request.params.pointer
            const length = request.params.length
  
            assert(pointer)
            assert(length)
  
            const buffer = mapSafeUint8Array(pointer, length)
  
            try {
              const len = await (task.options.input.file as IOReader).readToBuffer(length, buffer)
              task.stats.bufferReceiveBytes += static_cast<int64>(len)
              ipcPort.reply(request, len)
            }
            catch (error) {
              logger.error(`loader read error, ${error}, taskId: ${task.taskId}`)
              ipcPort.reply(request, errorType.DATA_INVALID)
            }
  
            break
          }
  
          case 'seek': {
            const pos = request.params.pos
  
            assert(pos >= 0)
  
            try {
              await (task.options.input.file as IOReader).seek(pos)
              ipcPort.reply(request)
            }
            catch (error) {
              logger.error(`loader seek error, ${error}, taskId: ${task.taskId}`)
              ipcPort.reply(request, null, error)
            }
            break
          }
  
          case 'size': {
            ipcPort.reply(request, await (task.options.input.file as IOReader).fileSize())
            break
          }
        }
      })
    }

    if (ext) {
      task.ext = ext
    }

    if (ret < 0) {
      logger.fatal(`register io task failed, ret: ${ret}, taskId: ${taskId}`)
    }
  }

  private async setTaskOutput(task: SelfTask) {
    const muxer2OutputChannel = task.muxer2OutputChannel = new MessageChannel()
    const ipcPort = task.outputIPCPort = new IPCPort(muxer2OutputChannel.port2)

    let format: AVFormat

    if (task.options.output.format) {
      format = Format2AVFormat[task.options.output.format]
    }
    else if (task.options.output.file instanceof FileSystemFileHandle) {
      let ext = task.options.output.file.name.split('.').pop()
      format = Ext2Format[ext]
    }

    if (!is.number(format)) {
      logger.fatal('invalid output format')
    }

    task.format = format

    let ret = await this.MuxThread.registerTask.transfer(muxer2OutputChannel.port1)
      .invoke({
        taskId: task.taskId,
        format,
        avpacketList: addressof(this.GlobalData.avpacketList),
        avpacketListMutex: addressof(this.GlobalData.avpacketListMutex),
        stats: addressof(task.stats),
        rightPort: muxer2OutputChannel.port1
      })

    if (ret < 0) {
      logger.fatal(`register mux task failed, ret: ${ret}, taskId: ${task.taskId}`)
    }
      
    let ioWriter: {
      write: (buffer: Uint8Array) => void
      appendBufferByPosition: (buffer: Uint8Array, pos: number) => void
      seek: (pos: number) => void
      close: () => void | Promise<void>
    }

    if (task.options.output.file instanceof FileSystemFileHandle) {
      ioWriter = task.safeFileIO = new SafeFileIO(task.options.output.file)
      await task.safeFileIO.ready()
    }
    else {
      ioWriter = {
        write: (buffer) => {
          (task.options.output.file as IOWriterSync).writeBuffer(buffer)
        },
        appendBufferByPosition: (buffer, pos) => {
          (task.options.output.file as IOWriterSync).flush()
          ;(task.options.output.file as IOWriterSync).writeBuffer(buffer)
          ;(task.options.output.file as IOWriterSync).flushToPos(static_cast<int64>(pos))
        },
        seek: (pos) => {
          (task.options.output.file as IOWriterSync).seek(static_cast<int64>(pos))
        },
        close: () => {
          (task.options.output.file as IOWriterSync).flush()
        }
      }
    }

    ipcPort.on(NOTIFY, async (request: RpcMessage) => {
      switch (request.method) {
        case 'write': {
          try {
            if (request.params.pos != null) {
              ioWriter.appendBufferByPosition(request.params.data, Number(request.params.pos))
            }
            else {
              ioWriter.write(request.params.data)
            }
            if (task.options.output.file instanceof FileSystemFileHandle) {
              if (task.safeFileIO.writeQueueSize > 5) {
                await this.MuxThread.pause(task.taskId)
                while (task.safeFileIO.writeQueueSize > 5) {
                  await new Sleep(0)
                }
                await this.MuxThread.unpause(task.taskId)
              }
            }
          }
          catch (error) {
            logger.error(`ioWriter write error, ${error}, taskId: ${task.taskId}`)
          }
          break
        }
        case 'seek': {
          const pos = request.params.pos

          assert(pos >= 0)

          try {
            ioWriter.seek(Number(pos))
          }
          catch (error) {
            logger.error(`ioWriter seek error, ${error}, taskId: ${task.taskId}`)
          }
          break
        }
        case 'end': {
          await ioWriter.close()
          await this.clearTask(task)
          this.fire(eventType.TASK_ENDED, [task.taskId])
        }
      }
    })

  }

  private async analyzeInputStreams(task: SelfTask) {
    const taskId = task.taskId
    const ioloader2DemuxerChannel = task.ioloader2DemuxerChannel
    const ext = task.ext
    const stats = task.stats

    let ret = 0
    let subTaskId: string
    if (defined(ENABLE_PROTOCOL_DASH) && this.isDash(task)) {
      await this.IOThread.open(taskId)
      const hasAudio = await this.IOThread.hasAudio(taskId)
      const hasVideo = await this.IOThread.hasVideo(taskId)
      if (hasAudio && hasVideo) {
        // dash 因为音视频各自独立，因此这里注册两个解封装任务
        subTaskId = generateUUID()
        await this.DemuxerThread.registerTask
          .transfer(ioloader2DemuxerChannel.port2)
          .invoke({
            taskId,
            leftPort: ioloader2DemuxerChannel.port2,
            format: Ext2Format[ext],
            stats: addressof(stats),
            isLive: false,
            flags: IOFlags.SLICE,
            ioloaderOptions: {
              mediaType: 'audio'
            },
            avpacketList: addressof(this.GlobalData.avpacketList),
            avpacketListMutex: addressof(this.GlobalData.avpacketListMutex),
          })
        await this.DemuxerThread.registerTask({
          taskId: subTaskId,
          mainTaskId: taskId,
          flags: IOFlags.SLICE,
          format: Ext2Format[ext],
          stats: addressof(stats),
          isLive: false,
          ioloaderOptions: {
            mediaType: 'video'
          },
          avpacketList: addressof(this.GlobalData.avpacketList),
          avpacketListMutex: addressof(this.GlobalData.avpacketListMutex)
        })
      }
      else {
        // dash 只有一个媒体类型
        await this.DemuxerThread.registerTask
          .transfer(ioloader2DemuxerChannel.port2)
          .invoke({
            taskId,
            leftPort: ioloader2DemuxerChannel.port2,
            format: Ext2Format[ext],
            stats: addressof(stats),
            isLive: false,
            flags: IOFlags.SLICE,
            ioloaderOptions: {
              mediaType: hasAudio ? 'audio' : 'video'
            },
            avpacketList: addressof(this.GlobalData.avpacketList),
            avpacketListMutex: addressof(this.GlobalData.avpacketListMutex),
          })
      }
    }
    else {
      await this.DemuxerThread.registerTask
        .transfer(ioloader2DemuxerChannel.port2)
        .invoke({
          taskId,
          leftPort: ioloader2DemuxerChannel.port2,
          format: Ext2Format[ext],
          stats: addressof(stats),
          isLive: false,
          flags: this.isHls(task) ? IOFlags.SLICE : 0,
          avpacketList: addressof(this.GlobalData.avpacketList),
          avpacketListMutex: addressof(this.GlobalData.avpacketListMutex)
        })
    }

    ret = await this.DemuxerThread.openStream(taskId)
    if (ret < 0) {
      logger.fatal(`open stream failed, ret: ${ret}, taskId: ${taskId}`)
    }
    let streams = await this.DemuxerThread.analyzeStreams(taskId)
    if (!streams.length) {
      logger.fatal(`analyze stream failed, ret: ${streams}`)
    }

    if (defined(ENABLE_PROTOCOL_DASH) && subTaskId) {
      ret = await this.DemuxerThread.openStream(subTaskId)
      if (ret < 0) {
        logger.fatal(`open stream failed, ret: ${ret}, taskId: ${taskId}`)
      }
      const subStreams = await this.DemuxerThread.analyzeStreams(subTaskId)
      if (!subStreams.length) {
        logger.fatal(`analyze stream failed, ret: ${streams}`)
      }
      streams = streams.concat(subStreams)
    }

    if (subTaskId) {
      task.subTaskId = subTaskId
    }

    let info = `
      taskId: ${taskId}
      input: ${is.string(task.options.input.file) ? task.options.input.file : (task.options.input.file instanceof File ? task.options.input.file.name : 'ioReader')}
      stream:
    `
    streams.forEach((stream) => {
      if (stream.codecpar.codecType === AVMediaType.AVMEDIA_TYPE_AUDIO) {
        stats.audiocodec = getAudioCodec(stream.codecpar)
      }
      else if (stream.codecpar.codecType === AVMediaType.AVMEDIA_TYPE_VIDEO) {
        stats.videocodec = getVideoCodec(stream.codecpar)
      }
      info += `
        #${stream.index}(und): ${stream.codecpar.codecType === AVMediaType.AVMEDIA_TYPE_AUDIO ? 'Audio' : 'Video'}: ${stream.codecpar.codecType === AVMediaType.AVMEDIA_TYPE_AUDIO ? stats.audiocodec : stats.videocodec}
      `
    })

    logger.info(info)

    if (defined(ENABLE_PROTOCOL_DASH) || defined(ENABLE_PROTOCOL_HLS)) {
      // m3u8 和 dash 的 duration 来自于协议本身
      if (this.isHls(task) || this.isDash(task)) {
        const duration: double = (await this.IOThread.getDuration(taskId)) * 1000
        if (duration > 0) {
          for (let i = 0; i < streams.length; i++) {
            streams[i].duration = avRescaleQ(
              static_cast<int64>(duration),
              AV_MILLI_TIME_BASE_Q,
              accessof(streams[i].timeBase)
            )
          }
        }
      }
    }
    return streams
  }

  private async handleAudioStream(stream: AVStreamInterface, task: SelfTask) {
    const audioConfig = task.options.output.audio
    if (audioConfig?.disable) {
      return
    }
    else if (audioConfig?.codec === 'copy') {
      const demuxer2MuxerChannel = new MessageChannel()
      await this.DemuxerThread.connectStreamTask
        .transfer(demuxer2MuxerChannel.port1)
        .invoke(task.taskId, stream.index, demuxer2MuxerChannel.port1)

      await this.MuxThread.addStream
        .transfer(demuxer2MuxerChannel.port2)
        .invoke(task.taskId, stream, demuxer2MuxerChannel.port2)

      task.streams.push({
        input: stream,
        demuxer2MuxerChannel
      })
    }
    else {
      const demuxer2DecoderChannel = new MessageChannel()
      const encoder2MuxerChannel = new MessageChannel()

      const decoder2FilterChannel = new MessageChannel()
      const filter2EncoderChannel = new MessageChannel()

      const newStream = this.copyAVStreamInterface(stream)
      const taskId = generateUUID()

      if (audioConfig) {
        if (audioConfig.codec) {
          const codecId = AudioCodecString2CodecId[audioConfig.codec]
          if (!is.number(codecId)) {
            logger.fatal(`invalid codec name(${audioConfig.codec})`)
          }
          newStream.codecpar.codecId = codecId

          if (newStream.codecpar.codecId !== stream.codecpar.codecId) {
            newStream.codecpar.profile = NOPTS_VALUE
            newStream.codecpar.level = NOPTS_VALUE
          }
        }
        if (audioConfig.bitrate) {
          newStream.codecpar.bitRate = static_cast<int64>(audioConfig.bitrate)
        }
        if (audioConfig.channels) {
          newStream.codecpar.chLayout.nbChannels = audioConfig.channels
        }
        if (audioConfig.sampleRate) {
          newStream.codecpar.sampleRate = audioConfig.sampleRate
        }
        if (audioConfig.sampleFmt) {
          const sampleFmt = SampleFmtString2SampleFormat[audioConfig.sampleFmt]
          if (!is.number(sampleFmt)) {
            logger.fatal(`invalid sampleFmt name(${audioConfig.sampleFmt})`)
          }
          newStream.codecpar.format = sampleFmt
        }
        if (audioConfig.profile) {
          newStream.codecpar.profile = audioConfig.profile
        }
      }

      if (newStream.codecpar.profile === NOPTS_VALUE) {
        if (newStream.codecpar.codecId === AVCodecID.AV_CODEC_ID_AAC) {
          newStream.codecpar.profile = aac.MPEG4AudioObjectTypes.AAC_LC
        }
        else if (newStream.codecpar.codecId === AVCodecID.AV_CODEC_ID_MP3) {
          newStream.codecpar.profile = 34
        }
      }

      await this.DemuxerThread.connectStreamTask
        .transfer(demuxer2DecoderChannel.port1)
        .invoke(task.taskId, stream.index, demuxer2DecoderChannel.port1)

      const decoderWasmUrl = this.options.getWasm('decoder', stream.codecpar.codecId)
      let decoderResource: WebAssemblyResource

      if (decoderWasmUrl) {
        if (is.string(decoderWasmUrl) || is.arrayBuffer(decoderWasmUrl)) {
          decoderResource = await compile({
            source: decoderWasmUrl
          })

          if (cheapConfig.USE_THREADS && defined(ENABLE_THREADS)) {
            decoderResource.threadModule = await compile(
              {
                // firefox 使用 arraybuffer 会卡主
                source: browser.firefox ? decoderWasmUrl : decoderResource.buffer
              },
              {
                child: true
              }
            )
          }
          delete decoderResource.buffer
        }
        else {
          decoderResource = decoderWasmUrl
        }
      }
      else {
        if (support.audioDecoder) {
          const isSupport = await AudioDecoder.isConfigSupported({
            codec: getVideoCodec(stream.codecpar),
            sampleRate: stream.codecpar.sampleRate,
            numberOfChannels: stream.codecpar.chLayout.nbChannels
          })
          if (!isSupport.supported) {
            logger.fatal(`AudioDecoder codecId ${stream.codecpar.codecId} not support`)
          }
        }
        else {
          logger.fatal(`audio decoder codecId ${stream.codecpar.codecId} not support`)
        }
      }

      // 注册一个音频解码任务
      await this.AudioDecoderThread.registerTask
        .transfer(demuxer2DecoderChannel.port2, decoder2FilterChannel.port1)
        .invoke({
          taskId: taskId,
          resource: decoderResource,
          leftPort: demuxer2DecoderChannel.port2,
          rightPort: decoder2FilterChannel.port1,
          stats: addressof(task.stats),
          avpacketList: addressof(this.GlobalData.avpacketList),
          avpacketListMutex: addressof(this.GlobalData.avpacketListMutex),
          avframeList: addressof(this.GlobalData.avframeList),
          avframeListMutex: addressof(this.GlobalData.avframeListMutex),
          timeBase: {
            num: stream.timeBase.num,
            den: stream.timeBase.den
          }
        })

      await this.AudioDecoderThread.open(taskId, stream.codecpar)

      const resamplerResourceUrl = this.options.getWasm('resampler')

      let resamplerResource: WebAssemblyResource

      if (resamplerResourceUrl) {
        if (is.string(resamplerResourceUrl) || is.arrayBuffer(resamplerResourceUrl)) {
          resamplerResource = await compile({
            source: resamplerResourceUrl
          })
        }
        else {
          resamplerResource = resamplerResourceUrl
        }
      }
      else {
        logger.fatal('resampler not found')
      }

      const resampleNode = createGraphDesVertex('resampler', {
        resource: resamplerResource,
        output: {
          channels: newStream.codecpar.chLayout.nbChannels,
          sampleRate: newStream.codecpar.sampleRate,
          format: newStream.codecpar.format as AVSampleFormat
        }
      })

      await this.AudioFilterThread.registerTask
      .transfer(decoder2FilterChannel.port2, filter2EncoderChannel.port1)
      .invoke({
        taskId: taskId,
        graph: {
          vertices: [resampleNode],
          edges: []
        },
        inputPorts: [
          {
            id: resampleNode.id,
            port: decoder2FilterChannel.port2
          }
        ],
        outputPorts: [
          {
            id: resampleNode.id,
            port: filter2EncoderChannel.port1
          }
        ],
        stats: addressof(task.stats),
        avframeList: addressof(this.GlobalData.avframeList),
        avframeListMutex: addressof(this.GlobalData.avframeListMutex),
      })
      
      const encoderWasmUrl = this.options.getWasm('encoder', newStream.codecpar.codecId)
      let encoderResource: WebAssemblyResource

      if (encoderWasmUrl) {
        if (is.string(encoderWasmUrl) || is.arrayBuffer(encoderWasmUrl)) {
          encoderResource = await compile({
            source: encoderWasmUrl
          })

          if (cheapConfig.USE_THREADS && defined(ENABLE_THREADS)) {
            encoderResource.threadModule = await compile(
              {
                // firefox 使用 arraybuffer 会卡主
                source: browser.firefox ? encoderWasmUrl : encoderResource.buffer
              },
              {
                child: true
              }
            )
          }
          delete encoderResource.buffer
        }
        else {
          encoderResource = encoderWasmUrl
        }
      }
      else {
        if (support.audioEncoder) {
          const isSupport = await AudioEncoder.isConfigSupported({
            codec: getAudioCodec(newStream.codecpar),
            sampleRate: newStream.codecpar.sampleRate,
            numberOfChannels: newStream.codecpar.chLayout.nbChannels,
            bitrate: static_cast<int32>(newStream.codecpar.bitRate),
            bitrateMode: 'constant'
          })
          if (!isSupport.supported) {
            logger.fatal(`AudioEncoder codecId ${newStream.codecpar.codecId} not support`)
          }
        }
        else {
          logger.fatal(`audio encoder codecId ${newStream.codecpar.codecId} not support`)
        }
      }

      // 注册一个音频编码任务
      await this.AudioEncoderThread.registerTask
        .transfer(filter2EncoderChannel.port2, encoder2MuxerChannel.port1)
        .invoke({
          taskId: taskId,
          resource: encoderResource,
          leftPort: filter2EncoderChannel.port2,
          rightPort: encoder2MuxerChannel.port1,
          stats: addressof(task.stats),
          avpacketList: addressof(this.GlobalData.avpacketList),
          avpacketListMutex: addressof(this.GlobalData.avpacketListMutex),
          avframeList: addressof(this.GlobalData.avframeList),
          avframeListMutex: addressof(this.GlobalData.avframeListMutex),
        })

      await this.AudioEncoderThread.open(taskId, newStream.codecpar, { num: newStream.timeBase.num, den: newStream.timeBase.den })
      await this.MuxThread.addStream
        .transfer(encoder2MuxerChannel.port2)
        .invoke(task.taskId, newStream, encoder2MuxerChannel.port2)

      task.streams.push({
        taskId,
        input: stream,
        output: newStream,
        demuxer2DecoderChannel,
        decoder2FilterChannel,
        filter2EncoderChannel,
        encoder2MuxerChannel
      })
    }
  }

  private async handleVideoStream(stream: AVStreamInterface, task: SelfTask) {
    const videoConfig = task.options.output.video
    if (videoConfig?.disable) {
      return
    }
    else if (videoConfig?.codec === 'copy') {
      const demuxer2MuxerChannel = new MessageChannel()
      await this.DemuxerThread.connectStreamTask
        .transfer(demuxer2MuxerChannel.port1)
        .invoke(task.subTaskId || task.taskId, stream.index, demuxer2MuxerChannel.port1)

      await this.MuxThread.addStream
        .transfer(demuxer2MuxerChannel.port2)
        .invoke(task.taskId, stream, demuxer2MuxerChannel.port2)

      task.streams.push({
        input: stream,
        demuxer2MuxerChannel
      })
    }
    else {
      const demuxer2DecoderChannel = new MessageChannel()
      const encoder2MuxerChannel = new MessageChannel()

      const decoder2FilterChannel = new MessageChannel()
      const filter2EncoderChannel = new MessageChannel()

      const newStream = this.copyAVStreamInterface(stream)

      const taskId = generateUUID()

      if (videoConfig) {
        if (videoConfig.codec) {
          const codecId = VideoCodecString2CodecId[videoConfig.codec]
          if (!is.number(codecId)) {
            logger.fatal(`invalid codec name(${videoConfig.codec})`)
          }
          newStream.codecpar.codecId = codecId

          if (newStream.codecpar.codecId !== stream.codecpar.codecId) {
            newStream.codecpar.profile = NOPTS_VALUE
            newStream.codecpar.level = NOPTS_VALUE
          }
        }
        if (videoConfig.width) {
          newStream.codecpar.width = videoConfig.width
        }
        if (videoConfig.height) {
          newStream.codecpar.height = videoConfig.height
        }
        if (videoConfig.bitrate) {
          newStream.codecpar.bitRate = static_cast<int64>(videoConfig.bitrate)
        }
        if (videoConfig.pixfmt) {
          const pixfmt = PixfmtString2AVPixelFormat[videoConfig.pixfmt]
          if (!is.number(pixfmt)) {
            logger.fatal(`invalid pixfmt name(${videoConfig.pixfmt})`)
          }
          newStream.codecpar.format = pixfmt
        }
        if (videoConfig.framerate) {
          newStream.codecpar.framerate.num = videoConfig.framerate >>> 0
          newStream.codecpar.framerate.den = 1
        }
        if (videoConfig.aspect) {
          newStream.codecpar.sampleAspectRatio.den = videoConfig.aspect.den
          newStream.codecpar.sampleAspectRatio.num = videoConfig.aspect.num
        }
        if (videoConfig.profile) {
          newStream.codecpar.profile = videoConfig.profile
        }
        if (videoConfig.level) {
          newStream.codecpar.level = videoConfig.level
        }
        if (videoConfig.delay) {
          newStream.codecpar.videoDelay = videoConfig.delay
        }
      }

      if (newStream.codecpar.profile === NOPTS_VALUE) {
        if (newStream.codecpar.codecId === AVCodecID.AV_CODEC_ID_H264) {
          newStream.codecpar.profile = newStream.codecpar.videoDelay ? h264.H264Profile.kHigh : h264.H264Profile.kConstrained
        }
        else if (newStream.codecpar.codecId === AVCodecID.AV_CODEC_ID_HEVC) {
          newStream.codecpar.profile = hevc.HEVCProfile.Main
        }
        else if (newStream.codecpar.codecId === AVCodecID.AV_CODEC_ID_VVC) {

        }
        else if (newStream.codecpar.codecId === AVCodecID.AV_CODEC_ID_AV1) {
          newStream.codecpar.profile = av1.AV1Profile.Main
        }
        else if (newStream.codecpar.codecId === AVCodecID.AV_CODEC_ID_VP9) {
          newStream.codecpar.profile = vp9.VP9Profile.Profile0
        }
      }
      if (newStream.codecpar.level === NOPTS_VALUE) {
        if (newStream.codecpar.codecId === AVCodecID.AV_CODEC_ID_H264) {
          newStream.codecpar.level = h264.getLevelByResolution(newStream.codecpar.width, newStream.codecpar.height, avQ2D(newStream.codecpar.framerate))
        }
        else if (newStream.codecpar.codecId === AVCodecID.AV_CODEC_ID_HEVC) {
          newStream.codecpar.level = hevc.getLevelByResolution(
            newStream.codecpar.profile,
            newStream.codecpar.width,
            newStream.codecpar.height,
            avQ2D(newStream.codecpar.framerate),
            static_cast<double>(newStream.codecpar.bitRate)
          )
        }
        else if (newStream.codecpar.codecId === AVCodecID.AV_CODEC_ID_VVC) {

        }
        else if (newStream.codecpar.codecId === AVCodecID.AV_CODEC_ID_AV1) {
          newStream.codecpar.level = av1.getLevelByResolution(newStream.codecpar.width, newStream.codecpar.height, avQ2D(newStream.codecpar.framerate))
        }
        else if (newStream.codecpar.codecId === AVCodecID.AV_CODEC_ID_VP9) {
          newStream.codecpar.level = vp9.getLevelByResolution(newStream.codecpar.width, newStream.codecpar.height, avQ2D(newStream.codecpar.framerate))
        }
      }

      if (!videoConfig || videoConfig.delay == null) {
        newStream.codecpar.videoDelay = 4
      }

      if (newStream.codecpar.codecId === AVCodecID.AV_CODEC_ID_H264
        || newStream.codecpar.codecId === AVCodecID.AV_CODEC_ID_HEVC
        || newStream.codecpar.codecId === AVCodecID.AV_CODEC_ID_VVC
      ) {
        if (task.format === AVFormat.MPEGTS) {
          newStream.codecpar.bitFormat = BitFormat.ANNEXB
        }
        else {
          newStream.codecpar.bitFormat = BitFormat.AVCC
        }
      }

      await this.DemuxerThread.connectStreamTask
        .transfer(demuxer2DecoderChannel.port1)
        .invoke(task.subTaskId || task.taskId, stream.index, demuxer2DecoderChannel.port1)

      const decoderWasmUrl = this.options.getWasm('decoder', stream.codecpar.codecId)
      let decoderResource: WebAssemblyResource

      if (decoderWasmUrl) {
        if (is.string(decoderWasmUrl) || is.arrayBuffer(decoderWasmUrl)) {
          decoderResource = await compile({
            source: decoderWasmUrl
          })

          if (cheapConfig.USE_THREADS && defined(ENABLE_THREADS)) {
            decoderResource.threadModule = await compile(
              {
                // firefox 使用 arraybuffer 会卡主
                source: browser.firefox ? decoderWasmUrl : decoderResource.buffer
              },
              {
                child: true
              }
            )
          }
          delete decoderResource.buffer
        }
        else {
          decoderResource = decoderWasmUrl
        }
      }
      else {
        if (support.videoDecoder) {
          const isSupport = await VideoDecoder.isConfigSupported({
            codec: getVideoCodec(stream.codecpar)
          })
          if (!isSupport.supported) {
            logger.fatal(`VideoDecoder codecId ${stream.codecpar.codecId} not support`)
          }
        }
        else {
          logger.fatal(`video decoder codecId ${stream.codecpar.codecId} not support`)
        }
      }

      // 注册一个视频解码任务
      await this.VideoDecoderThread.registerTask
        .transfer(demuxer2DecoderChannel.port2, decoder2FilterChannel.port1)
        .invoke({
          taskId: taskId,
          resource: decoderResource,
          leftPort: demuxer2DecoderChannel.port2,
          rightPort: decoder2FilterChannel.port1,
          stats: addressof(task.stats),
          enableHardware: this.options.enableHardware,
          avpacketList: addressof(this.GlobalData.avpacketList),
          avpacketListMutex: addressof(this.GlobalData.avpacketListMutex),
          avframeList: addressof(this.GlobalData.avframeList),
          avframeListMutex: addressof(this.GlobalData.avframeListMutex)
        })
      await this.VideoDecoderThread.open(taskId, stream.codecpar)

      const scalerResourceUrl = this.options.getWasm('scaler')

      let scalerResource: WebAssemblyResource

      if (scalerResourceUrl) {
        if (is.string(scalerResourceUrl) || is.arrayBuffer(scalerResourceUrl)) {
          scalerResource = await compile({
            source: scalerResourceUrl
          })
        }
        else {
          scalerResource = scalerResourceUrl
        }
      }
      else {
        logger.fatal('scaler not found')
      }

      const scaleNode = createGraphDesVertex('scale', {
        resource: scalerResource,
        output: {
          width: newStream.codecpar.width,
          height: newStream.codecpar.height,
          format: newStream.codecpar.format as AVPixelFormat
        }
      })

      await this.AudioFilterThread.registerTask
      .transfer(decoder2FilterChannel.port2, filter2EncoderChannel.port1)
      .invoke({
        taskId: taskId,
        graph: {
          vertices: [scaleNode],
          edges: []
        },
        inputPorts: [
          {
            id: scaleNode.id,
            port: decoder2FilterChannel.port2
          }
        ],
        outputPorts: [
          {
            id: scaleNode.id,
            port: filter2EncoderChannel.port1
          }
        ],
        stats: addressof(task.stats),
        avframeList: addressof(this.GlobalData.avframeList),
        avframeListMutex: addressof(this.GlobalData.avframeListMutex),
      })
      
      const encoderWasmUrl = this.options.getWasm('encoder', newStream.codecpar.codecId)
      let encoderResource: WebAssemblyResource

      if (encoderWasmUrl) {
        if (is.string(encoderWasmUrl) || is.arrayBuffer(encoderWasmUrl)) {
          encoderResource = await compile({
            source: encoderWasmUrl
          })

          if (cheapConfig.USE_THREADS && defined(ENABLE_THREADS)) {
            encoderResource.threadModule = await compile(
              {
                // firefox 使用 arraybuffer 会卡主
                source: browser.firefox ? encoderWasmUrl : encoderResource.buffer
              },
              {
                child: true
              }
            )
          }
          delete encoderResource.buffer
        }
        else {
          encoderResource = encoderWasmUrl
        }
      }
      else {
        if (support.videoEncoder) {
          const isSupport = await VideoEncoder.isConfigSupported({
            codec: getVideoCodec(newStream.codecpar),
            width: newStream.codecpar.width,
            height: newStream.codecpar.height
          })
          if (!isSupport.supported) {
            logger.fatal(`VideoEncoder codecId ${newStream.codecpar.codecId} not support`)
          }
        }
        else {
          logger.fatal(`video encoder codecId ${newStream.codecpar.codecId} not support`)
        }
      }

      // 注册一个视频编码任务
      await this.VideoEncoderThread.registerTask
        .transfer(filter2EncoderChannel.port2, encoder2MuxerChannel.port1)
        .invoke({
          taskId: taskId,
          resource: encoderResource,
          leftPort: filter2EncoderChannel.port2,
          rightPort: encoder2MuxerChannel.port1,
          stats: addressof(task.stats),
          enableHardware: this.options.enableHardware,
          avpacketList: addressof(this.GlobalData.avpacketList),
          avpacketListMutex: addressof(this.GlobalData.avpacketListMutex),
          avframeList: addressof(this.GlobalData.avframeList),
          avframeListMutex: addressof(this.GlobalData.avframeListMutex),
          gop: static_cast<int32>(avQ2D(newStream.codecpar.framerate) * (videoConfig?.keyFrameInterval ?? 5000) / 1000)
        })

      await this.VideoEncoderThread.open(taskId, newStream.codecpar, { num: newStream.timeBase.num, den: newStream.timeBase.den })
      await this.MuxThread.addStream.transfer(encoder2MuxerChannel.port2)
        .invoke(task.taskId, newStream, encoder2MuxerChannel.port2)

      task.streams.push({
        taskId,
        input: stream,
        output: newStream,
        demuxer2DecoderChannel,
        decoder2FilterChannel,
        filter2EncoderChannel,
        encoder2MuxerChannel
      })
    }
  }

  private async handleCopyStream(stream: AVStreamInterface, task: SelfTask) {
    const demuxer2MuxerChannel = new MessageChannel()
    await this.DemuxerThread.connectStreamTask
      .transfer(demuxer2MuxerChannel.port1)
      .invoke(task.subTaskId || task.taskId, stream.index, demuxer2MuxerChannel.port1)

    await this.MuxThread.addStream
      .transfer(demuxer2MuxerChannel.port2)
      .invoke(task.taskId, stream, demuxer2MuxerChannel.port2)

    task.streams.push({
      input: stream,
      demuxer2MuxerChannel
    })
  }

  private async clearTask(task: SelfTask) {
    this.MuxThread.unregisterTask(task.taskId)
    for (let i = 0; i < task.streams.length; i++) {
      if (task.streams[i].taskId) {
        if (task.streams[i].input.codecpar.codecType === AVMediaType.AVMEDIA_TYPE_AUDIO) {
          await this.AudioEncoderThread.unregisterTask(task.streams[i].taskId)
          await this.AudioFilterThread.unregisterTask(task.streams[i].taskId)
          await this.AudioDecoderThread.unregisterTask(task.streams[i].taskId)
        }
        else if (task.streams[i].input.codecpar.codecType === AVMediaType.AVMEDIA_TYPE_VIDEO) {
          await this.VideoEncoderThread.unregisterTask(task.streams[i].taskId)
          await this.VideoFilterThread.unregisterTask(task.streams[i].taskId)
          await this.VideoDecoderThread.unregisterTask(task.streams[i].taskId)
        }
      }
      if (task.streams[i].output) {
        freeCodecParameters(task.streams[i].output.codecpar)
        avFree(task.streams[i].output.timeBase)
      }
    }
    
    this.DemuxerThread.unregisterTask(task.taskId)
    if (task.subTaskId) {
      this.DemuxerThread.unregisterTask(task.subTaskId)
    }
    this.IOThread.unregisterTask(task.taskId)

    if (task.inputIPCPort) {
      task.inputIPCPort.destroy()
    }
    if (task.outputIPCPort) {
      task.outputIPCPort.destroy()
    }
    if (task.safeFileIO) {
      task.safeFileIO.destroy()
    }
    if (task.stats) {
      unmake(task.stats)
    }
  }

  public async addTask(taskOptions: TaskOptions) {
    if (taskOptions.output.audio?.disable && taskOptions.output.video?.disable) {
      logger.fatal('audio and video are all disable')
    }

    const taskId = generateUUID()
    const stats = make(Stats)
    const task: SelfTask = {
      taskId,
      options: taskOptions,
      ioloader2DemuxerChannel: null,
      muxer2OutputChannel: null,
      stats,
      format: AVFormat.UNKNOWN,
      streams: []
    }
    try {
      await this.setTaskInput(task)
      await this.setTaskOutput(task)

      const streams = await this.analyzeInputStreams(task)

      for (let i = 0; i < streams.length; i++) {
        const mediaType = streams[i].codecpar.codecType
        if (mediaType === AVMediaType.AVMEDIA_TYPE_AUDIO) {
          await this.handleAudioStream(streams[i], task)
        }
        else if (mediaType === AVMediaType.AVMEDIA_TYPE_VIDEO) {
          await this.handleVideoStream(streams[i], task)
        }
        else {
          await this.handleCopyStream(streams[i], task)
        }
      }
      this.tasks.set(taskId, task)
      return taskId
    }
    catch (error) {
      await this.clearTask(task)
      throw error
    }
  }

  public async startTask(taskId: string) {
    const task = this.tasks.get(taskId)
    if (task) {
      await this.DemuxerThread.startDemux(taskId, false, 10)
      await this.MuxThread.open(taskId)

      const streams = task.streams

      for (let i = 0; i < streams.length; i++) {
        if (!streams[i].output) {
          continue
        }

        let buffer: Uint8Array
        if (streams[i].output.codecpar.codecType === AVMediaType.AVMEDIA_TYPE_AUDIO) {
          buffer = await this.AudioEncoderThread.getExtraData(streams[i].taskId)
        }
        else if (streams[i].output.codecpar.codecType === AVMediaType.AVMEDIA_TYPE_VIDEO) {
          buffer = await this.VideoEncoderThread.getExtraData(streams[i].taskId)
        }

        if (!buffer) {
          const codecId = streams[i].output.codecpar.codecId
          if (codecId === AVCodecID.AV_CODEC_ID_AAC) {
            buffer = aac.avCodecParameters2Extradata(accessof(streams[i].output.codecpar))
          }
          else if (codecId === AVCodecID.AV_CODEC_ID_OPUS) {
            buffer = opus.avCodecParameters2Extradata(accessof(streams[i].output.codecpar))
          }
        }

        if (buffer) {
          const extradata = avMalloc(buffer.length)
          memcpyFromUint8Array(extradata, buffer.length, buffer)
          streams[i].output.codecpar.extradata = extradata
          streams[i].output.codecpar.extradataSize = buffer.length
          await this.MuxThread.updateAVCodecParameters(task.taskId, streams[i].output.index, streams[i].output.codecpar)
        }
      }

      await this.MuxThread.start(taskId)
    }
    else {
      logger.fatal(`task ${taskId} not found`)
    }
  }

  public async pauseTask(taskId: string) {
    const task = this.tasks.get(taskId)
    if (task) {
      await this.MuxThread.pause(taskId)
    }
    else {
      logger.fatal(`task ${taskId} not found`)
    }
  }

  public async unpauseTask(taskId: string) {
    const task = this.tasks.get(taskId)
    if (task) {
      await this.MuxThread.unpause(taskId)
    }
    else {
      logger.fatal(`task ${taskId} not found`)
    }
  }

  public async cancelTask(taskId: string) {
    const task = this.tasks.get(taskId)
    if (task) {
      await this.MuxThread.unpause(taskId)
      await this.clearTask(task)
    }
    else {
      logger.fatal(`task ${taskId} not found`)
    }
  }

  public async destroy() {
    if (this.MuxThread) {
      await this.MuxThread.clear()
      closeThread(this.MuxThread)
    }
    if (this.AudioEncoderThread) {
      await this.AudioEncoderThread.clear()
      closeThread(this.AudioEncoderThread)
    }
    if (this.AudioFilterThread) {
      await this.AudioFilterThread.clear()
      closeThread(this.AudioFilterThread)
    }
    if (this.AudioDecoderThread) {
      await this.AudioDecoderThread.clear()
      closeThread(this.AudioDecoderThread)
    }
    if (this.VideoEncoderThread) {
      await this.VideoEncoderThread.clear()
      closeThread(this.VideoEncoderThread)
    }
    if (this.VideoFilterThread) {
      await this.VideoFilterThread.clear()
      closeThread(this.VideoFilterThread)
    }
    if (this.VideoDecoderThread) {
      await this.VideoDecoderThread.clear()
      closeThread(this.VideoDecoderThread)
    }
    if (this.DemuxerThread) {
      await this.DemuxerThread.clear()
      closeThread(this.DemuxerThread)
    }
    if (this.IOThread) {
      await this.IOThread.clear()
      closeThread(this.IOThread)
    }

    this.VideoEncoderThread = null
    this.VideoFilterThread = null
    this.VideoDecoderThread = null
    this.AudioEncoderThread = null
    this.AudioFilterThread = null
    this.AudioDecoderThread = null
    this.DemuxerThread = null
    this.IOThread = null
    this.MuxThread = null

    if (this.GlobalData) {
      this.GlobalData.avframeList.clear((avframe) => {
        unrefAVFrame(avframe)
      })
      this.GlobalData.avpacketList.clear((avpacket) => {
        unrefAVPacket(avpacket)
      })

      mutex.destroy(addressof(this.GlobalData.avpacketListMutex))
      mutex.destroy(addressof(this.GlobalData.avframeListMutex))

      unmake(this.GlobalData)
      this.GlobalData = null
    }

    logger.info('AVTranscoder pipelines stopped')

  }

  public setLogLevel(level: number) {
    this.level = level
    logger.setLevel(level)

    if (this.IOThread) {
      this.IOThread.setLogLevel(level)
    }
    if (this.DemuxerThread) {
      this.DemuxerThread.setLogLevel(level)
    }
    if (this.AudioDecoderThread) {
      this.AudioDecoderThread.setLogLevel(level)
    }
    if (this.AudioFilterThread) {
      this.AudioFilterThread.setLogLevel(level)
    }
    if (this.AudioEncoderThread) {
      this.AudioEncoderThread.setLogLevel(level)
    }
    if (this.VideoDecoderThread) {
      this.VideoDecoderThread.setLogLevel(level)
    }
    if (this.VideoFilterThread) {
      this.VideoFilterThread.setLogLevel(level)
    }
    if (this.VideoEncoderThread) {
      this.VideoEncoderThread.setLogLevel(level)
    }
    if (this.MuxThread) {
      this.MuxThread.setLogLevel(level)
    }

    logger.info(`set log level: ${level}`)
  }
}
