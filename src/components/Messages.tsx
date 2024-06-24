'use client'
import { cn, toPusherKey } from '@/lib/utils'
import { Message } from '@/lib/validators/messsage'
import { FC, useEffect, useRef, useState } from 'react'
import { format } from 'date-fns'
import Image from 'next/image'
import { pusherClient } from '@/lib/pusher'

interface MessagesProps {
  initialMessages: Message[]
  sessionId: string
  chatPartner: User
  sessionImg: string | null | undefined
  chatId: string
}

interface Prop {
  data: number
}

// const book {
//   chapter_1 : 1
//   chapter_2 : 2

// }
const Messages: FC<MessagesProps> = ({
  initialMessages,
  sessionId,
  chatPartner,
  sessionImg,
  chatId,
}) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const scrollDownRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    pusherClient.subscribe(toPusherKey(`chat:${chatId}`))
    console.log(toPusherKey(`chat:${chatId}`))
    const messageHandler = (message: Message) => {
      setMessages((prev) => [message, ...prev])
    }
    const numberhandler = (data: Prop) => {
      console.log(data.data)
    }
    pusherClient.bind('incoming_message', messageHandler)
    pusherClient.bind('send_number', numberhandler)

    return () => {
      pusherClient.unsubscribe(toPusherKey(`chat:${chatId}`))

      pusherClient.unbind('incoming_message', messageHandler)
    }
  }, [chatId])
  return (
    <div
      id='messages'
      className='flex h-full flex-1 flex-col-reverse gap-4 p-3 overflow-y-auto scrollbar-thumb-rounded scrollbar-thumb-blue scrollbar-track-blue-lighter scrollbar-w-2 scrilling-touch'
    >
      <div ref={scrollDownRef} />
      {messages.map((message, index) => {
        const isCurrentUser = message.senderId === sessionId

        const hasNextMessagefromSameUser =
          messages[index - 1]?.senderId === messages[index].senderId

        const formatTimeStamp = (timestamp: number) => {
          return format(timestamp, 'HH:mm')
        }

        return (
          <div
            key={`${message.id}-${message.timestamp}`}
            className='chat-message'
          >
            <div
              className={cn('flex items-end', {
                'justify-end': isCurrentUser,
              })}
            >
              <div
                className={cn(
                  'flex flex-col space-y-2 text-base max-w-xs mx-2',
                  {
                    'order-1 items-end': isCurrentUser,
                    'order-2 items-start': !isCurrentUser,
                  }
                )}
              >
                <span
                  className={cn('px-4 py-2 rounded-lg inline-block', {
                    'bg-indigo-600 text-white': isCurrentUser,
                    'bg-gray-200 text-gray-900': !isCurrentUser,
                    'rounded-br-none':
                      !hasNextMessagefromSameUser && isCurrentUser,
                    'rounded-bl-none':
                      !hasNextMessagefromSameUser && !isCurrentUser,
                  })}
                >
                  {message.text}{' '}
                  <span className='ml-2 text-xs text-gray-400'>
                    {formatTimeStamp(message.timestamp)}
                  </span>
                </span>
              </div>
              <div
                className={cn('relative w-6 h-6', {
                  'order-2': isCurrentUser,
                  'order-1': !isCurrentUser,
                  'invisible h-6': hasNextMessagefromSameUser,
                })}
              >
                <Image
                  fill
                  alt='profile image'
                  src={
                    isCurrentUser ? (sessionImg as string) : chatPartner.image
                  }
                  referrerPolicy='no-referrer'
                  className='rounded-full'
                />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default Messages
