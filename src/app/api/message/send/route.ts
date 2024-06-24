import { fetchRedis } from '@/helpers/redis'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import {
  Message,
  messageArrayValidatore,
  messageValidator,
} from '@/lib/validators/messsage'
import { getServerSession } from 'next-auth'
import { nanoid } from 'nanoid'
import { pusherServer } from '@/lib/pusher'
import { toPusherKey } from '@/lib/utils'

export async function POST(req: Request) {
  try {
    const { text, chatId }: { text: string; chatId: string } = await req.json()
    const session = await getServerSession(authOptions)

    if (!session) {
      return new Response('Unauthorised', { status: 401 })
    }

    const [userId1, userId2] = chatId.split('--')

    if (session.user.id !== userId1 && session.user.id !== userId2) {
      return new Response('Unauthorised', { status: 401 })
    }

    const friendId = session.user.id === userId1 ? userId2 : userId1

    const friendList = (await fetchRedis(
      'smembers',
      `user:${session.user.id}:friends`
    )) as string[]

    const isFriend = friendList.includes(friendId)

    if (!isFriend) {
      return new Response('Unauthorised', { status: 401 })
    }

    const sender = (await fetchRedis(
      'get',
      `user:${session.user.id}`
    )) as string

    const parsedSender = JSON.parse(sender) as User
    const timestamp = Date.now()
    const messageData: Message = {
      id: nanoid(),
      senderId: session.user.id,
      text,
      timestamp,
    }

    const message = messageValidator.parse(messageData)

    //notify all connected chat room clients
    pusherServer.trigger(
      toPusherKey(`chat:${chatId}`),
      'incoming_message',
      message
    )

    pusherServer.trigger(toPusherKey(`user:${friendId}:chats`), 'new_message', {
      ...message,
      senderImg: parsedSender.image,
      senderName: parsedSender.name,
    })

    pusherServer.trigger(toPusherKey(`chat:${chatId}`), 'send_number', {
      data: 10,
    })

    //all valid, send message

    await db.zadd(`chat:${chatId}:messages`, {
      score: timestamp,
      member: JSON.stringify(message),
    })
    return new Response('Ok')
  } catch (error) {
    if (error instanceof Error) {
      return new Response(error.message, { status: 500 })
    }
    return new Response('Internal server error', { status: 500 })
  }
}
