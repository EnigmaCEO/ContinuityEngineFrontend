import { type NextRequest } from "next/server";
import { proxyCaseLibraryAdminPost } from "../../_adminProxy";

export async function POST(req: NextRequest) {
  return proxyCaseLibraryAdminPost(req, "/case-library/replay/refresh-eligibility", "Validation eligibility refresh");
}
