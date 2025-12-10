import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing env vars");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("--- Starting Diagnosis ---");

  // 1. Get a user
  // いいねをしているユーザーを探すために、likesテーブルからuser_idを取得してみる
  const { data: likeSample } = await supabase.from('likes').select('user_id').limit(1);
  let targetUserId = '';
  
  if (likeSample && likeSample.length > 0) {
      targetUserId = likeSample[0].user_id;
      console.log(`Found a user with likes: ${targetUserId}`);
  } else {
      // いいねがない場合は適当なユーザーを取得
      const { data: users } = await supabase.from("users").select("user_id").limit(1);
      if (users && users.length > 0) {
          targetUserId = users[0].user_id;
          console.log(`No likes found, fallback to user: ${targetUserId}`);
      } else {
          console.error("No users found.");
          return;
      }
  }

  const PAGE = 1;
  const LIMIT = 5;
  const from = (PAGE - 1) * LIMIT;
  const to = from + LIMIT - 1;

  // 2. Test fetchLikedActivitiesWithPagination logic
  console.log("\n--- Testing fetchLikedActivitiesWithPagination Query ---");
  const { data: likesData, error: likesError } = await supabase
    .from("likes")
    .select("activity_id", { count: "exact" })
    .eq("user_id", targetUserId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (likesError) {
    console.error("Error fetching likes:", likesError);
  } else {
    console.log(`Found ${likesData?.length} likes.`);
    if (likesData && likesData.length > 0) {
        const activityIds = likesData.map((l: any) => l.activity_id);
        console.log("Activity IDs:", activityIds);
        
        const { data: activities, error: actError } = await supabase
            .from("activities")
            .select("id, text")
            .in("id", activityIds);
            
        if (actError) console.error("Error fetching activities:", actError);
        else console.log(`Fetched ${activities?.length} corresponding activities.`);
    }
  }

  // 3. Test fetchMyLikedActivitiesWithPagination logic
  // 今度は自分の投稿にいいねがついているユーザーを探す
  // しかし簡単のために targetUserId を使う（自分の投稿にいいねがついていると仮定はできないが、クエリのエラーチェックはできる）
  
  console.log("\n--- Testing fetchMyLikedActivitiesWithPagination Query ---");
  // !inner join ver
  const { data: myLiked, error: myLikedError, count } = await supabase
    .from("activities")
    .select(
      `
      id,
      text,
      user_id,
      likes!inner(user_id)
      `,
      { count: "exact" }
    )
    .eq("user_id", targetUserId)
    // .distinct() // distinct is not directly available on select builder in valid way usually without modifying generic
    .range(from, to);

  if (myLikedError) {
    console.error("Error fetching my liked activities:", myLikedError);
    console.error("Details:", JSON.stringify(myLikedError, null, 2));
  } else {
    console.log(`Found ${myLiked?.length} my liked activities (Count: ${count}).`);
    if (myLiked && myLiked.length > 0) {
        console.log("Sample:", JSON.stringify(myLiked[0], null, 2));
    }
  }
}

run();
