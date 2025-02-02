import FriendRequestSidebarOption from '@/components/FriendRequestSidebarOption'
import { Icon, Icons } from '@/components/Icons'
import MobileChatLayout from '@/components/MobileChatLayout'
import SidebarChatList from '@/components/SidebarChatList'
import SignOutButton from '@/components/SignOutButton'
import { getFriendsByUserId } from '@/helpers/get-friends-by-user-id'
import { fetchRedis } from '@/helpers/redis'
import { authOptions } from '@/lib/auth'
import { SidebarOption } from '@/types/typing'
import { getServerSession } from 'next-auth'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ReactNode } from 'react'

interface layoutProps {
  children: ReactNode
}

const sidebarOptions: SidebarOption[] = [
  {
    id: 1,
    name: 'Add friend',
    href: '/dashboard/add',
    Icon: 'UserPlus',
  },
]

const Layout = async ({ children }: layoutProps) => {
  const session = await getServerSession(authOptions)

  if (!session) {
    return notFound()
  }
  const friends = await getFriendsByUserId(session.user.id)

  const unseenRequestCount = (
    (await fetchRedis(
      'smembers',
      `user:${session.user.id}:incoming_friend_requests`
    )) as User[]
  ).length

  return (
    <div className='w-full flex h-screen'>
      <div className='md:hidden'>
        <MobileChatLayout
          friends={friends}
          session={session}
          sidebarOptions={sidebarOptions}
          unseenRequestCount={unseenRequestCount}
        />
      </div>
      <div className='hidden md:flex h-full w-full max-w-xs grow flex-col gap-y-5 overflow-y-auto border-r border-gray border-gray-200 bg-white px-6'>
        <Link href='/dashboard' className='flex h-16 shrink-0 items-center'>
          <Icons.Logo className='h-8 w-auto text-indigo-600' />
        </Link>
        {friends.length > 0 ? (
          <div className='text-xs font-semibold leaving-6 text-gray-400'>
            Your chats
          </div>
        ) : null}
        <nav className='flex flex-1 flex-col'>
          <ul role='list' className='flex flex-1 flex-col gap-y-7 '>
            <li>
              <SidebarChatList friends={friends} sessionId={session.user.id} />
            </li>

            <li>
              <div className='text-xs font-semibold leading-6 text-gray-400'>
                Overview
              </div>
              <ul role='list' className='-mx-2 mt-2 space-y-1'>
                {sidebarOptions.map((option) => {
                  const Icon = Icons[option.Icon]
                  return (
                    <li key={option.id}>
                      <Link
                        href={option.href}
                        className='flex  gap-5 text-gray-700 hover:text-indigo-600 hover:bg-gray-50 group rounded-md p-2 text-sm leading-6 font-semibold'
                      >
                        <span className='text-gray-400 border-gray-200 group-hover:border-indigo-600 group-hover:text-indigo-600 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border text-[0.625rem] font-medium bg-white'>
                          <Icon className='h-4 w-4' />
                        </span>
                        <span className='truncate'>{option.name}</span>
                      </Link>
                    </li>
                  )
                })}
                <li>
                  <FriendRequestSidebarOption
                    initialUnseenRequestCount={unseenRequestCount}
                    sessionId={session.user.id}
                  />
                </li>
              </ul>
            </li>

            <li className='-mx-6 mt-auto flex items-center'>
              <div className='flex flex-1 items-center gap-x-4 px-6 py-3 text-sm font-semibold leading-6 text-gray-900'>
                <div className='relative h-8 w-8 bg-gray-50'>
                  <Image
                    alt='user'
                    fill
                    referrerPolicy='no-referrer'
                    className='rounded-full'
                    src={session.user.image || ''}
                  />
                </div>
                <span className='sr-only'>Your profile</span>
                <div className='flex flex-col'>
                  <span aria-hidden='true'>{session.user.name}</span>
                  <span className='text-xs text-zinc-400' aria-hidden='true'>
                    {session.user.email}
                  </span>
                </div>
              </div>
              <SignOutButton className='h-full aspect-square' />
            </li>
          </ul>
        </nav>
      </div>
      <aside className='max-h-screen container py-16 md:py-12 w-full'>
        {children}
      </aside>
    </div>
  )
}

export default Layout
