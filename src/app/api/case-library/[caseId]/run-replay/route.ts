import { type NextRequest } from "next/server";
import { proxyCaseLibraryAdminPost } from "../../_adminProxy";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ caseId: string }> },
) {
  const { caseId } = await params;
  return proxyCaseLibraryAdminPost(
    req,
    `/case-library/${encodeURIComponent(caseId)}/run-replay`,
    "Validation",
  );
}
