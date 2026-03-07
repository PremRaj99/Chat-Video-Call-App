"use client";
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRouter } from 'next/navigation';
import { useState } from 'react';


export default function page() {
  const router = useRouter();
  const [name, setName] = useState('');
  return (
    <div className='flex items-center justify-center flex-col gap-3 w-full bg-sky-50 text-blue-950 h-screen'>
      <h1 className='text-7xl font-bold mb-4 text-center text-blue-800'>Omegle: VideoCall & Chat</h1>
      <p className='text-xl mb-4'>Welcome to the Omegle VideoCall & Chat frontend!</p>
      <div className="flex w-96 items-center gap-4">
        <Input placeholder='Enter Your Name' value={name} onChange={(e) => setName(e.target.value)} />
        <Button className='bg-blue-800' onClick={() => router.push(`/${name}`)}>JOIN</Button>
      </div>

    </div>
  )
}
