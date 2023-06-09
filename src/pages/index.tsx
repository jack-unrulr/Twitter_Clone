import { type NextPage } from "next";
import Head from "next/head";
// import Link from "next/link";
import { SignInButton,useUser } from "@clerk/nextjs";

import { type RouterOutputs, api } from "~/utils/api";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Image from "next/image";
import { LoadingScreen, LoadingSpinner } from "~/components/loading";
import { useState } from "react";
import toast from "react-hot-toast";

dayjs.extend(relativeTime);

const CreatePostWizard = () =>{
  const { user } = useUser();
  const [input, setInput] = useState("");
  const ctx = api.useContext();
  const {mutate, isLoading: isPosting} = api.posts.create.useMutation({
    onSuccess: async () => {
      setInput("");
      await ctx.posts.getAll.invalidate();
    },
    onError: (e) => {
      const errorMessage = e.data?.zodError?.fieldErrors.content;
      if(errorMessage && errorMessage[0]){
        toast.error(errorMessage[0]);
      } else {
        toast.error("Failed to create post.")
      }
      },
  });
  console.log(user?.id)
  if(!user) return null;
  return(
    <div className="flex gap-4 w-full">
      <Image 
        src={user.profileImageUrl} 
        alt="Profile Image" 
        className="w-14 h-14 rounded-full" 
        width={56}
        height={56}
      />
      <input 
        placeholder="Type some emojis!" 
        className="bg-transparent outline-none grow"
        value ={input}
        onChange={(e) => setInput(e.target.value)}
        
        onKeyDown={(e) => {
          if (e.key === "Enter"){
            e.preventDefault();
            if (input !== ""){
              mutate({content: input});
            }
          }
        }}
        disabled={isPosting}
      />
      {input !== "" && !isPosting && (
        <button 
          onClick = {() => mutate({ content: input})} 
          disabled={isPosting}
        >
          Post
        </button>
      )}
      {isPosting && (
        <div className="flex items-center justify-center">
            <LoadingSpinner size={20} />
        </div>
      )}
    </div>
  )
}

type PostWithUser = RouterOutputs["posts"]["getAll"][number]

const PostView = (props:  PostWithUser) => {
  const {post, author} = props;
  return(
    <div key={post.id} className="p-4 gap-4 border-b border-slate-400 flex">
     <Image 
        src={author.profilePicture} 
        className="w-14 h-14 rounded-full"
        alt={`${author.username ? `@${author.username}'s` : 'User'} profile picture`}
        width={56}
        height={56}
      />
     <div className="flex flex-col">
        <div className="flex font-bold text-slate-300 gap-1">
          <span>@{author.username}</span>
          <span className="font-thin">• {dayjs(post.createdAt).fromNow()}</span>
        </div>
        <span className="text-2xl">{post.content}</span>
      </div>
    </div>
  );
}

const Feed = () => {
  const { data, isLoading: postsLoading } = api.posts.getAll.useQuery();
  
  if (postsLoading) return <LoadingScreen />;
  if (!data) return <div>Something went wrong</div>;
  
  return(
    <div className="flex-col">
      {data?.map((fullPost) => (
        <PostView {...fullPost} key={fullPost.post.id}/>
      ))}
    </div>
  )
}

const Home: NextPage = () => {
  const {isLoaded: userLoaded, isSignedIn} = useUser();
  //start data fetch early
  api.posts.getAll.useQuery();
  
  if (!userLoaded) return <div />

  return (
    <>
      <Head>
        <title>Create T3 App</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="h-screen flex justify-center">
      <div className="w-full md:max-w-2xl border-x border-slate-400">
        <div className="border-b border-slate-400 p-4 flex">
          {!isSignedIn && <div className="flex justify-center"><SignInButton /></div>}
          {isSignedIn && <CreatePostWizard />}
        </div>
        <Feed />
      </div>
      </main>
    </>
  );
};

export default Home;
