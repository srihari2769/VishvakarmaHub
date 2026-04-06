import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { successResponse, errorResponse, getTokenFromRequest } from '@/lib/utils';

export const maxDuration = 30;

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return errorResponse('Unauthorized', 401);

    const payload = verifyToken(token);
    if (payload.role !== 'ADMIN') return errorResponse('Forbidden', 403);

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'stats': {
        const [userCount, startupCount, totalFunding, pendingCount, withdrawalCount] = await Promise.all([
          prisma.user.count(),
          prisma.startup.count(),
          prisma.campaign.aggregate({ _sum: { raisedAmount: true } }),
          prisma.startup.count({ where: { status: 'PENDING' } }),
          prisma.withdrawal.count({ where: { status: 'PENDING' } }),
        ]);

        return successResponse({
          totalUsers: userCount,
          totalStartups: startupCount,
          totalFunding: totalFunding._sum.raisedAmount || 0,
          pendingReview: pendingCount,
          pendingWithdrawals: withdrawalCount,
        });
      }

      case 'pending-startups': {
        const pendingStartups = await prisma.startup.findMany({
          where: { status: 'PENDING' },
          include: {
            founder: { select: { firstName: true, lastName: true, email: true } },
            campaign: { select: { fundingGoal: true } },
          },
          orderBy: { createdAt: 'desc' },
        });
        return successResponse(pendingStartups);
      }

      case 'all-startups': {
        const allStartups = await prisma.startup.findMany({
          include: {
            founder: { select: { firstName: true, lastName: true, email: true } },
            campaign: { select: { fundingGoal: true, raisedAmount: true, supporterCount: true, status: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 100,
        });
        return successResponse(allStartups);
      }

      case 'users': {
        const users = await prisma.user.findMany({
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
            createdAt: true,
            _count: { select: { startups: true, contributions: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        });
        return successResponse(users);
      }

      case 'reports': {
        // Get platform-wide report data
        const [
          totalUsers,
          totalStartups,
          totalCampaigns,
          fundingAgg,
          contributionCount,
          recentContributions,
          startupsByStatus,
          campaignsByStatus,
          withdrawalStats,
        ] = await Promise.all([
          prisma.user.count(),
          prisma.startup.count(),
          prisma.campaign.count(),
          prisma.campaign.aggregate({ _sum: { raisedAmount: true }, _avg: { raisedAmount: true } }),
          prisma.contribution.count({ where: { status: 'COMPLETED' } }),
          prisma.contribution.findMany({
            where: { status: 'COMPLETED' },
            select: { amount: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
            take: 30,
          }),
          prisma.startup.groupBy({ by: ['status'], _count: { id: true } }),
          prisma.campaign.groupBy({ by: ['status'], _count: { id: true } }),
          prisma.withdrawal.groupBy({ by: ['status'], _count: { id: true }, _sum: { amount: true } }),
        ]);

        return successResponse({
          totalUsers,
          totalStartups,
          totalCampaigns,
          totalFunding: fundingAgg._sum.raisedAmount || 0,
          avgFunding: fundingAgg._avg.raisedAmount || 0,
          totalContributions: contributionCount,
          recentContributions,
          startupsByStatus: startupsByStatus.map((s) => ({ status: s.status, count: s._count.id })),
          campaignsByStatus: campaignsByStatus.map((c) => ({ status: c.status, count: c._count.id })),
          withdrawalStats: withdrawalStats.map((w) => ({ status: w.status, count: w._count.id, amount: w._sum.amount || 0 })),
        });
      }

      case 'withdrawals': {
        const withdrawals = await prisma.withdrawal.findMany({
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
            campaign: { select: { startup: { select: { title: true, slug: true } } } },
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        });
        return successResponse(withdrawals);
      }

      case 'contacts': {
        const contacts = await prisma.contactSubmission.findMany({
          orderBy: { createdAt: 'desc' },
          take: 100,
        });
        return successResponse(contacts);
      }

      case 'competition-entries': {
        const competition = await prisma.competition.findFirst({
          where: { isActive: true },
          include: {
            entries: {
              include: {
                startup: {
                  select: { id: true, title: true, slug: true, category: true, logo: true },
                },
                user: {
                  select: { firstName: true, lastName: true, email: true },
                },
                _count: { select: { votes: true } },
              },
              orderBy: { createdAt: 'desc' },
            },
            judges: { orderBy: { createdAt: 'asc' } },
            sponsors: { orderBy: { price: 'desc' } },
            campusPartners: { orderBy: { createdAt: 'asc' } },
            citizenPasses: { orderBy: { createdAt: 'desc' } },
            participants: {
              include: {
                user: { select: { firstName: true, lastName: true, email: true } },
              },
              orderBy: { createdAt: 'desc' },
            },
            freeEntries: {
              include: {
                user: { select: { firstName: true, lastName: true, email: true } },
                referrals: {
                  include: {
                    referredUser: { select: { firstName: true, lastName: true, email: true } },
                  },
                },
              },
              orderBy: { createdAt: 'desc' },
            },
            _count: { select: { entries: true, citizenPasses: true, participants: true, freeEntries: true } },
          },
        });
        return successResponse(competition);
      }

      case 'vsc-data': {
        const vscChallenge = await prisma.vSCChallenge.findFirst({
          where: { isActive: true },
          include: {
            rounds: { orderBy: { roundNumber: 'asc' } },
            participants: {
              include: {
                user: { select: { firstName: true, lastName: true, email: true } },
                attempts: { select: { id: true, roundId: true, score: true, maxScore: true, passed: true, completedAt: true, submission: true, videoUrl: true, reviewStatus: true, adminScore: true, adminFeedback: true } },
                powerUps: { select: { type: true, paymentStatus: true, isUsed: true } },
              },
              orderBy: { createdAt: 'desc' },
            },
            _count: { select: { participants: true, rounds: true } },
          },
        });
        return successResponse(vscChallenge);
      }

      case 'vsc-analytics': {
        const challenge = await prisma.vSCChallenge.findFirst({ where: { isActive: true } });
        if (!challenge) return successResponse(null);

        const [totalParticipants, paidParticipants, eliminatedCount, totalAttempts, pendingReviews, powerUpsPurchased, powerUpsUsed] = await Promise.all([
          prisma.vSCParticipant.count({ where: { challengeId: challenge.id } }),
          prisma.vSCParticipant.count({ where: { challengeId: challenge.id, paymentStatus: 'PAID' } }),
          prisma.vSCParticipant.count({ where: { challengeId: challenge.id, isEliminated: true, paymentStatus: 'PAID' } }),
          prisma.vSCRoundAttempt.count({ where: { participant: { challengeId: challenge.id } } }),
          prisma.vSCRoundAttempt.count({ where: { participant: { challengeId: challenge.id }, completedAt: { not: null }, reviewStatus: 'PENDING', round: { roundType: { in: ['CREATIVITY', 'EXECUTION', 'SOCIAL_PROOF', 'VIDEO_PITCH'] } } } }),
          prisma.vSCPowerUp.count({ where: { participant: { challengeId: challenge.id }, paymentStatus: 'PAID' } }),
          prisma.vSCPowerUp.count({ where: { participant: { challengeId: challenge.id }, paymentStatus: 'PAID', isUsed: true } }),
        ]);

        // Revenue calculation
        const paidEntries = await prisma.vSCParticipant.findMany({
          where: { challengeId: challenge.id, paymentStatus: 'PAID' },
          select: { entryFee: true },
        });
        const entryRevenue = paidEntries.reduce((sum, p) => sum + p.entryFee, 0);

        const paidPowerUps = await prisma.vSCPowerUp.findMany({
          where: { participant: { challengeId: challenge.id }, paymentStatus: 'PAID' },
          select: { price: true, type: true },
        });
        const powerUpRevenue = paidPowerUps.reduce((sum, p) => sum + p.price, 0);

        // Per-round stats
        const rounds = await prisma.vSCRound.findMany({
          where: { challengeId: challenge.id },
          orderBy: { roundNumber: 'asc' },
          select: { id: true, roundNumber: true, title: true, roundType: true },
        });

        const roundStats = await Promise.all(rounds.map(async (r) => {
          const [attempted, passed, failed, pending] = await Promise.all([
            prisma.vSCRoundAttempt.count({ where: { roundId: r.id, completedAt: { not: null } } }),
            prisma.vSCRoundAttempt.count({ where: { roundId: r.id, passed: true } }),
            prisma.vSCRoundAttempt.count({ where: { roundId: r.id, completedAt: { not: null }, passed: false } }),
            prisma.vSCRoundAttempt.count({ where: { roundId: r.id, completedAt: { not: null }, reviewStatus: 'PENDING', round: { roundType: { in: ['CREATIVITY', 'EXECUTION', 'SOCIAL_PROOF', 'VIDEO_PITCH'] } } } }),
          ]);
          return { ...r, attempted, passed, failed, pendingReview: pending };
        }));

        // Funnel: how many participants reached each round
        const funnelData = await Promise.all(rounds.map(async (r) => {
          const reached = await prisma.vSCParticipant.count({
            where: { challengeId: challenge.id, paymentStatus: 'PAID', currentRound: { gte: r.roundNumber } },
          });
          return { round: r.roundNumber, title: r.title, reached };
        }));

        // Power-up breakdown
        const powerUpBreakdown = ['SKIP_ROUND', 'EXTRA_TIME', 'REVIVE', 'LEADERBOARD_BOOST'].map(type => ({
          type,
          purchased: paidPowerUps.filter(p => p.type === type).length,
          revenue: paidPowerUps.filter(p => p.type === type).reduce((s, p) => s + p.price, 0),
        }));

        return successResponse({
          totalParticipants,
          paidParticipants,
          eliminatedCount,
          activeCount: paidParticipants - eliminatedCount,
          totalAttempts,
          pendingReviews,
          powerUpsPurchased,
          powerUpsUsed,
          entryRevenue,
          powerUpRevenue,
          totalRevenue: entryRevenue + powerUpRevenue,
          roundStats,
          funnelData,
          powerUpBreakdown,
        });
      }

      case 'vsc-pending-reviews': {
        const challenge = await prisma.vSCChallenge.findFirst({ where: { isActive: true } });
        if (!challenge) return successResponse([]);

        const pendingAttempts = await prisma.vSCRoundAttempt.findMany({
          where: {
            participant: { challengeId: challenge.id },
            completedAt: { not: null },
            reviewStatus: 'PENDING',
            round: { roundType: { in: ['CREATIVITY', 'EXECUTION', 'SOCIAL_PROOF', 'VIDEO_PITCH'] } },
          },
          include: {
            participant: { select: { id: true, name: true, email: true, currentRound: true } },
            round: { select: { id: true, roundNumber: true, title: true, roundType: true, prompt: true, scoringCriteria: true, passingPercent: true } },
          },
          orderBy: { completedAt: 'asc' },
        });
        return successResponse(pendingAttempts);
      }

      default:
        return errorResponse('Invalid action parameter', 400);
    }
  } catch (error) {
    console.error('Admin API error:', error);
    return errorResponse('Internal server error', 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return errorResponse('Unauthorized', 401);

    const payload = verifyToken(token);
    if (payload.role !== 'ADMIN') return errorResponse('Forbidden', 403);

    const body = await request.json();
    const { action, startupId, userId, withdrawalId, adminNote } = body;

    switch (action) {
      case 'approve-startup': {
        const startup = await prisma.startup.update({
          where: { id: startupId },
          data: { status: 'APPROVED' },
        });
        if (startup) {
          await prisma.campaign.updateMany({
            where: { startupId },
            data: { status: 'ACTIVE' },
          });
        }
        await prisma.notification.create({
          data: {
            type: 'SYSTEM',
            title: 'Startup Approved!',
            message: 'Your startup has been approved and is now live on the platform.',
            userId: startup.founderId,
            link: `/startup/${startup.slug}`,
          },
        });
        return successResponse({ message: 'Startup approved' });
      }

      case 'reject-startup': {
        const startup = await prisma.startup.update({
          where: { id: startupId },
          data: { status: 'REJECTED' },
        });
        await prisma.notification.create({
          data: {
            type: 'SYSTEM',
            title: 'Startup Submission Update',
            message: 'Your startup submission has been reviewed and requires changes.',
            userId: startup.founderId,
          },
        });
        return successResponse({ message: 'Startup rejected' });
      }

      case 'suspend-user': {
        const targetUser = await prisma.user.findUnique({ where: { id: userId } });
        if (!targetUser) return errorResponse('User not found', 404);

        const updated = await prisma.user.update({
          where: { id: userId },
          data: { isActive: !targetUser.isActive },
        });
        return successResponse({
          message: updated.isActive ? 'User reactivated' : 'User suspended',
          isActive: updated.isActive,
        });
      }

      case 'approve-withdrawal': {
        const withdrawal = await prisma.withdrawal.update({
          where: { id: withdrawalId },
          data: { status: 'APPROVED', adminNote, processedAt: new Date() },
        });
        await prisma.notification.create({
          data: {
            type: 'WITHDRAWAL',
            title: 'Withdrawal Approved',
            message: `Your withdrawal request of ₹${withdrawal.amount.toLocaleString()} has been approved. Funds will be transferred shortly.`,
            userId: withdrawal.userId,
          },
        });
        return successResponse({ message: 'Withdrawal approved' });
      }

      case 'reject-withdrawal': {
        const withdrawal = await prisma.withdrawal.update({
          where: { id: withdrawalId },
          data: { status: 'REJECTED', adminNote, processedAt: new Date() },
        });
        await prisma.notification.create({
          data: {
            type: 'WITHDRAWAL',
            title: 'Withdrawal Rejected',
            message: `Your withdrawal request of ₹${withdrawal.amount.toLocaleString()} has been rejected. ${adminNote || ''}`,
            userId: withdrawal.userId,
          },
        });
        return successResponse({ message: 'Withdrawal rejected' });
      }

      case 'mark-contact-read': {
        const { contactId } = body;
        if (!contactId) return errorResponse('Contact ID required', 400);
        await prisma.contactSubmission.update({
          where: { id: contactId },
          data: { isRead: true },
        });
        return successResponse({ message: 'Marked as read' });
      }

      case 'update-competition': {
        const { competitionId: compId, ...updateData } = body;
        if (!compId) return errorResponse('Competition ID required', 400);
        const allowedFields = ['name', 'tagline', 'description', 'currentPhase', 'studentFee', 'founderFee', 'boothPrice', 'boothDescription', 'registrationStart', 'registrationEnd', 'screeningEnd', 'votingEnd', 'finalsDate', 'pageContent', 'manualRegistrations', 'showSponsorPrices', 'showFinalDate'];
        const filtered: Record<string, unknown> = {};
        for (const key of allowedFields) {
          if (updateData[key] !== undefined) {
            if (['registrationStart', 'registrationEnd', 'screeningEnd', 'votingEnd', 'finalsDate'].includes(key)) {
              filtered[key] = new Date(updateData[key] as string);
            } else if (key === 'showSponsorPrices' || key === 'showFinalDate') {
              filtered[key] = !!updateData[key];
            } else {
              filtered[key] = updateData[key];
            }
          }
        }
        const updatedComp = await prisma.competition.update({
          where: { id: compId },
          data: filtered,
        });
        return successResponse(updatedComp);
      }

      case 'add-sponsor': {
        const { competitionId: sponsorCompId, tier, sponsorName, logo: sponsorLogo, price, benefits: sponsorBenefits } = body;
        if (!sponsorCompId || !tier || !sponsorName || !price) return errorResponse('Missing sponsor fields', 400);
        const sponsor = await prisma.competitionSponsor.create({
          data: {
            tier,
            name: sponsorName,
            logo: sponsorLogo || null,
            price: parseFloat(price),
            benefits: JSON.stringify(sponsorBenefits || []),
            competitionId: sponsorCompId,
          },
        });
        return successResponse(sponsor, 201);
      }

      case 'delete-sponsor': {
        const { sponsorId } = body;
        if (!sponsorId) return errorResponse('Sponsor ID required', 400);
        await prisma.competitionSponsor.delete({ where: { id: sponsorId } });
        return successResponse({ message: 'Sponsor deleted' });
      }

      case 'edit-sponsor': {
        const { sponsorId: editSId, tier: editSTier, sponsorName: editSName, logo: editSLogo, price: editSPrice, benefits: editSBenefits } = body;
        if (!editSId || !editSTier || !editSName || !editSPrice) return errorResponse('Missing sponsor fields', 400);
        const updatedSponsor = await prisma.competitionSponsor.update({
          where: { id: editSId },
          data: { tier: editSTier, name: editSName, logo: editSLogo || null, price: parseFloat(editSPrice), benefits: JSON.stringify(editSBenefits || []) },
        });
        return successResponse(updatedSponsor);
      }

      case 'add-campus-partner': {
        const { competitionId: cpCompId, partnerName, partnerLogo, partnerWebsite } = body;
        if (!cpCompId || !partnerName) return errorResponse('Missing partner fields', 400);
        const partner = await prisma.campusPartner.create({
          data: {
            name: partnerName,
            logo: partnerLogo || null,
            website: partnerWebsite || null,
            competitionId: cpCompId,
          },
        });
        return successResponse(partner, 201);
      }

      case 'delete-campus-partner': {
        const { partnerId } = body;
        if (!partnerId) return errorResponse('Partner ID required', 400);
        await prisma.campusPartner.delete({ where: { id: partnerId } });
        return successResponse({ message: 'Campus partner deleted' });
      }

      case 'edit-campus-partner': {
        const { partnerId: editPId, partnerName: editPName, partnerLogo: editPLogo, partnerWebsite: editPWebsite } = body;
        if (!editPId || !editPName) return errorResponse('Missing partner fields', 400);
        const updatedPartner = await prisma.campusPartner.update({
          where: { id: editPId },
          data: { name: editPName, logo: editPLogo || null, website: editPWebsite || null },
        });
        return successResponse(updatedPartner);
      }

      case 'add-judge': {
        const { competitionId: judgeCompId, judgeName, judgeTitle, judgeOrganization, judgeAvatar } = body;
        if (!judgeCompId || !judgeName || !judgeTitle || !judgeOrganization) return errorResponse('Missing judge fields', 400);
        const judge = await prisma.competitionJudge.create({
          data: {
            name: judgeName,
            title: judgeTitle,
            organization: judgeOrganization,
            avatar: judgeAvatar || null,
            competitionId: judgeCompId,
          },
        });
        return successResponse(judge, 201);
      }

      case 'edit-judge': {
        const { judgeId: editJudgeId, judgeName: editJName, judgeTitle: editJTitle, judgeOrganization: editJOrg, judgeAvatar: editJAvatar } = body;
        if (!editJudgeId || !editJName || !editJTitle || !editJOrg) return errorResponse('Missing judge fields', 400);
        const updatedJudge = await prisma.competitionJudge.update({
          where: { id: editJudgeId },
          data: { name: editJName, title: editJTitle, organization: editJOrg, avatar: editJAvatar || null },
        });
        return successResponse(updatedJudge);
      }

      case 'delete-judge': {
        const { judgeId } = body;
        if (!judgeId) return errorResponse('Judge ID required', 400);
        await prisma.competitionJudge.delete({ where: { id: judgeId } });
        return successResponse({ message: 'Judge deleted' });
      }

      case 'delete-citizen-pass': {
        const { passId } = body;
        if (!passId) return errorResponse('Pass ID required', 400);
        await prisma.citizenPass.delete({ where: { id: passId } });
        return successResponse({ message: 'Citizen pass deleted' });
      }

      case 'update-entry-status': {
        const { entryId, status: entryStatus } = body;
        if (!entryId || !entryStatus) return errorResponse('Entry ID and status required', 400);
        const validStatuses = ['SUBMITTED', 'SHORTLISTED', 'SELECTED_TOP200', 'PUBLIC_VOTING', 'FINALIST', 'WINNER', 'ELIMINATED'];
        if (!validStatuses.includes(entryStatus)) return errorResponse('Invalid status', 400);
        const updatedEntry = await prisma.competitionEntry.update({
          where: { id: entryId },
          data: { status: entryStatus },
        });
        return successResponse(updatedEntry);
      }

      case 'update-participant-status': {
        const { participantId: pId, status: pStatus } = body;
        if (!pId || !pStatus) return errorResponse('Participant ID and status required', 400);
        const validParticipantStatuses = ['REGISTERED', 'IDEA_SUBMITTED', 'SHORTLISTED', 'SELECTED', 'FINALIST', 'WINNER', 'ELIMINATED'];
        if (!validParticipantStatuses.includes(pStatus)) return errorResponse('Invalid status', 400);
        const updatedParticipant = await prisma.competitionParticipant.update({
          where: { id: pId },
          data: { status: pStatus },
        });
        return successResponse(updatedParticipant);
      }

      case 'update-participant-mode': {
        const { participantId: modeId, participationMode: mode } = body;
        if (!modeId || !mode) return errorResponse('Participant ID and mode required', 400);
        if (!['IDEA_SUBMISSION', 'EVENT_ACCESS'].includes(mode)) return errorResponse('Invalid participation mode', 400);
        const updatedMode = await prisma.competitionParticipant.update({
          where: { id: modeId },
          data: { participationMode: mode },
        });
        return successResponse(updatedMode);
      }

      case 'delete-participant': {
        const { participantId: delPId } = body;
        if (!delPId) return errorResponse('Participant ID required', 400);
        await prisma.competitionParticipant.delete({ where: { id: delPId } });
        return successResponse({ message: 'Participant deleted' });
      }

      case 'approve-free-entry-video': {
        const { freeEntryId: approveFeId, adminNotes: approveNotes } = body;
        if (!approveFeId) return errorResponse('Free entry ID required', 400);
        const fe = await prisma.freeEntry.findUnique({ where: { id: approveFeId } });
        if (!fe) return errorResponse('Free entry not found', 404);
        const verifiedCount = await prisma.freeEntryReferral.count({ where: { freeEntryId: approveFeId, paymentVerified: true } });
        const updated = await prisma.freeEntry.update({
          where: { id: approveFeId },
          data: {
            videoStatus: 'APPROVED',
            adminNotes: approveNotes || null,
            approvedAt: new Date(),
            approvedBy: payload.userId,
            status: verifiedCount >= 5 ? 'APPROVED' : 'UNDER_REVIEW',
            freeEntryGranted: verifiedCount >= 5,
          },
        });
        return successResponse(updated);
      }

      case 'reject-free-entry-video': {
        const { freeEntryId: rejectFeId, adminNotes: rejectNotes } = body;
        if (!rejectFeId) return errorResponse('Free entry ID required', 400);
        await prisma.freeEntry.update({
          where: { id: rejectFeId },
          data: {
            videoStatus: 'REJECTED',
            adminNotes: rejectNotes || null,
            status: 'REJECTED',
            freeEntryGranted: false,
          },
        });
        return successResponse({ message: 'Video rejected' });
      }

      case 'grant-free-entry': {
        const { freeEntryId: grantFeId } = body;
        if (!grantFeId) return errorResponse('Free entry ID required', 400);
        await prisma.freeEntry.update({
          where: { id: grantFeId },
          data: {
            status: 'APPROVED',
            freeEntryGranted: true,
            approvedAt: new Date(),
            approvedBy: payload.userId,
          },
        });
        return successResponse({ message: 'Free entry granted' });
      }

      case 'delete-free-entry': {
        const { freeEntryId: delFeId } = body;
        if (!delFeId) return errorResponse('Free entry ID required', 400);
        await prisma.freeEntryReferral.deleteMany({ where: { freeEntryId: delFeId } });
        await prisma.freeEntry.delete({ where: { id: delFeId } });
        return successResponse({ message: 'Free entry deleted' });
      }

      // ─── VSC Actions ───

      case 'vsc-create-challenge': {
        const { name, tagline, description, entryFee, secondChanceFee, thirdChanceFee, skipRoundPrice, extraTimePrice, revivePrice, leaderboardBoostPrice } = body;
        if (!name || !tagline || !description) return errorResponse('Name, tagline, description required', 400);
        const challenge = await prisma.vSCChallenge.create({
          data: {
            name, tagline, description,
            entryFee: parseFloat(entryFee) || 99,
            secondChanceFee: parseFloat(secondChanceFee) || 49,
            thirdChanceFee: parseFloat(thirdChanceFee) || 19,
            skipRoundPrice: parseFloat(skipRoundPrice) || 199,
            extraTimePrice: parseFloat(extraTimePrice) || 29,
            revivePrice: parseFloat(revivePrice) || 59,
            leaderboardBoostPrice: parseFloat(leaderboardBoostPrice) || 39,
          },
        });
        return successResponse(challenge);
      }

      case 'vsc-update-challenge': {
        const { challengeId: ucId, ...updateFields } = body;
        if (!ucId) return errorResponse('Challenge ID required', 400);
        const numericFields = ['entryFee', 'secondChanceFee', 'thirdChanceFee', 'skipRoundPrice', 'extraTimePrice', 'revivePrice', 'leaderboardBoostPrice', 'manualRegistrations'];
        const data: Record<string, unknown> = {};
        for (const [key, val] of Object.entries(updateFields)) {
          if (key === 'action') continue;
          if (numericFields.includes(key)) data[key] = parseFloat(val as string) || 0;
          else if (key === 'isActive') data[key] = val === true || val === 'true';
          else data[key] = val;
        }
        const updated = await prisma.vSCChallenge.update({ where: { id: ucId }, data });
        return successResponse(updated);
      }

      case 'vsc-add-round': {
        const { challengeId: arCid, roundNumber: arNum, title: arTitle, description: arDesc, roundType: arType, timeLimit: arTime, passingPercent: arPass, prompt: arPrompt } = body;
        if (!arCid || !arNum || !arTitle || !arType) return errorResponse('Challenge ID, roundNumber, title, roundType required', 400);
        const round = await prisma.vSCRound.create({
          data: {
            challengeId: arCid,
            roundNumber: parseInt(arNum),
            title: arTitle,
            description: arDesc || '',
            roundType: arType,
            timeLimit: parseInt(arTime) || 600,
            passingPercent: parseFloat(arPass) || 60,
            prompt: arPrompt || null,
          },
        });
        return successResponse(round);
      }

      case 'vsc-update-round': {
        const { roundId: urId, questionPool: urQp, scoringCriteria: urSc, ...urFields } = body;
        if (!urId) return errorResponse('Round ID required', 400);
        const numRoundFields = ['roundNumber', 'timeLimit'];
        const floatRoundFields = ['passingPercent'];
        const boolRoundFields = ['isActive', 'isLocked'];
        const urData: Record<string, unknown> = {};
        for (const [key, val] of Object.entries(urFields)) {
          if (key === 'action') continue;
          if (numRoundFields.includes(key)) urData[key] = parseInt(val as string) || 0;
          else if (floatRoundFields.includes(key)) urData[key] = parseFloat(val as string) || 0;
          else if (boolRoundFields.includes(key)) urData[key] = val === true || val === 'true';
          else if (key === 'startsAt' || key === 'endsAt') urData[key] = val ? new Date(val as string) : null;
          else urData[key] = val;
        }
        if (urQp !== undefined) urData.questionPool = urQp;
        if (urSc !== undefined) urData.scoringCriteria = urSc;
        const updatedRound = await prisma.vSCRound.update({ where: { id: urId }, data: urData });
        return successResponse(updatedRound);
      }

      case 'vsc-delete-round': {
        const { roundId: drId } = body;
        if (!drId) return errorResponse('Round ID required', 400);
        await prisma.vSCRoundAttempt.deleteMany({ where: { roundId: drId } });
        await prisma.vSCRound.delete({ where: { id: drId } });
        return successResponse({ message: 'Round deleted' });
      }

      case 'vsc-eliminate-participant': {
        const { participantId: epId, roundNumber: epRound } = body;
        if (!epId) return errorResponse('Participant ID required', 400);
        await prisma.vSCParticipant.update({
          where: { id: epId },
          data: { isEliminated: true, eliminatedAt: parseInt(epRound) || null },
        });
        return successResponse({ message: 'Participant eliminated' });
      }

      case 'vsc-revive-participant': {
        const { participantId: rpId } = body;
        if (!rpId) return errorResponse('Participant ID required', 400);
        await prisma.vSCParticipant.update({
          where: { id: rpId },
          data: { isEliminated: false, eliminatedAt: null },
        });
        return successResponse({ message: 'Participant revived' });
      }

      case 'vsc-delete-participant': {
        const { participantId: dpId } = body;
        if (!dpId) return errorResponse('Participant ID required', 400);
        await prisma.vSCPowerUp.deleteMany({ where: { participantId: dpId } });
        await prisma.vSCRoundAttempt.deleteMany({ where: { participantId: dpId } });
        await prisma.vSCParticipant.delete({ where: { id: dpId } });
        return successResponse({ message: 'Participant deleted' });
      }

      case 'vsc-update-participant-score': {
        const { participantId: usId, totalScore: usScore, currentRound: usCr } = body;
        if (!usId) return errorResponse('Participant ID required', 400);
        const scoreData: Record<string, unknown> = {};
        if (usScore !== undefined) scoreData.totalScore = parseFloat(usScore);
        if (usCr !== undefined) scoreData.currentRound = parseInt(usCr);
        await prisma.vSCParticipant.update({ where: { id: usId }, data: scoreData });
        return successResponse({ message: 'Participant updated' });
      }

      // Admin review submission (text/video rounds)
      case 'vsc-review-submission': {
        const { attemptId: rsId, adminScore: rsScore, adminFeedback: rsFeedback, passed: rsPassed } = body;
        if (!rsId) return errorResponse('Attempt ID required', 400);
        if (rsScore === undefined) return errorResponse('Score is required', 400);

        const attempt = await prisma.vSCRoundAttempt.findUnique({
          where: { id: rsId },
          include: { round: true, participant: true },
        });
        if (!attempt) return errorResponse('Attempt not found', 404);

        const adminScoreVal = parseFloat(rsScore);
        const maxScore = attempt.maxScore || 100;
        const percentage = (adminScoreVal / maxScore) * 100;
        const didPass = rsPassed === true || rsPassed === 'true';

        // Update the attempt with admin review
        await prisma.vSCRoundAttempt.update({
          where: { id: rsId },
          data: {
            reviewStatus: 'REVIEWED',
            adminScore: adminScoreVal,
            adminFeedback: rsFeedback || null,
            reviewedBy: payload.userId,
            reviewedAt: new Date(),
            score: adminScoreVal,
            percentage,
            passed: didPass,
          },
        });

        // Update participant total score (add admin score)
        await prisma.vSCParticipant.update({
          where: { id: attempt.participantId },
          data: {
            totalScore: { increment: adminScoreVal },
            ...(didPass ? { currentRound: attempt.round.roundNumber + 1 } : { isEliminated: true, eliminatedAt: attempt.round.roundNumber }),
          },
        });

        return successResponse({ message: `Submission reviewed — ${didPass ? 'PASSED' : 'FAILED'}` });
      }

      // Bulk review: auto-pass all quiz rounds that meet threshold
      case 'vsc-finalize-round': {
        const { roundId: frId } = body;
        if (!frId) return errorResponse('Round ID required', 400);

        const round = await prisma.vSCRound.findUnique({ where: { id: frId } });
        if (!round) return errorResponse('Round not found', 404);

        // Get all completed attempts for this round
        const attempts = await prisma.vSCRoundAttempt.findMany({
          where: { roundId: frId, completedAt: { not: null } },
          orderBy: { score: 'desc' },
        });

        if (attempts.length === 0) return errorResponse('No attempts to finalize', 400);

        // Calculate cutoff based on passingPercent
        const cutoffIndex = Math.ceil(attempts.length * (round.passingPercent / 100));
        const cutoffScore = attempts[Math.min(cutoffIndex - 1, attempts.length - 1)]?.score ?? 0;

        let passedCount = 0;
        let failedCount = 0;

        for (let i = 0; i < attempts.length; i++) {
          const a = attempts[i];
          const didPass = a.score >= cutoffScore && i < cutoffIndex;

          await prisma.vSCRoundAttempt.update({
            where: { id: a.id },
            data: { passed: didPass, rank: i + 1, reviewStatus: 'REVIEWED', reviewedAt: new Date(), reviewedBy: payload.userId },
          });

          await prisma.vSCParticipant.update({
            where: { id: a.participantId },
            data: didPass
              ? { currentRound: round.roundNumber + 1 }
              : { isEliminated: true, eliminatedAt: round.roundNumber },
          });

          if (didPass) passedCount++;
          else failedCount++;
        }

        return successResponse({ message: `Round finalized: ${passedCount} passed, ${failedCount} eliminated`, passedCount, failedCount, cutoffScore });
      }

      // Schedule round open/close
      case 'vsc-schedule-round': {
        const { roundId: srId, startsAt: srStart, endsAt: srEnd, isActive: srActive, isLocked: srLocked } = body;
        if (!srId) return errorResponse('Round ID required', 400);
        const scheduleData: Record<string, unknown> = {};
        if (srStart !== undefined) scheduleData.startsAt = srStart ? new Date(srStart) : null;
        if (srEnd !== undefined) scheduleData.endsAt = srEnd ? new Date(srEnd) : null;
        if (srActive !== undefined) scheduleData.isActive = srActive === true || srActive === 'true';
        if (srLocked !== undefined) scheduleData.isLocked = srLocked === true || srLocked === 'true';
        await prisma.vSCRound.update({ where: { id: srId }, data: scheduleData });
        return successResponse({ message: 'Round schedule updated' });
      }

      // Issue certificate
      case 'vsc-issue-certificate': {
        const { participantId: icId, type: icType } = body;
        if (!icId || !icType) return errorResponse('Participant ID and type required', 400);

        const participant = await prisma.vSCParticipant.findUnique({ where: { id: icId } });
        if (!participant) return errorResponse('Participant not found', 404);

        const cert = await prisma.vSCCertificate.upsert({
          where: { participantId_challengeId: { participantId: icId, challengeId: participant.challengeId } },
          update: { type: icType, rank: participant.rank, totalScore: participant.totalScore, roundsCompleted: participant.currentRound - 1 },
          create: {
            userId: participant.userId,
            participantId: icId,
            challengeId: participant.challengeId,
            type: icType,
            rank: participant.rank,
            totalScore: participant.totalScore,
            roundsCompleted: participant.currentRound - 1,
          },
        });

        return successResponse(cert);
      }

      // Verify social proof for Round 6
      case 'vsc-verify-social-proof': {
        const { attemptId: vspId, score: vspScore, feedback: vspFeedback, passed: vspPassed } = body;
        if (!vspId) return errorResponse('Attempt ID required', 400);

        const spAttempt = await prisma.vSCRoundAttempt.findUnique({
          where: { id: vspId },
          include: { round: true, participant: true },
        });
        if (!spAttempt) return errorResponse('Attempt not found', 404);

        const spDidPass = vspPassed === true || vspPassed === 'true';
        const spScore = parseFloat(vspScore) || 0;

        await prisma.vSCRoundAttempt.update({
          where: { id: vspId },
          data: {
            reviewStatus: 'REVIEWED',
            adminScore: spScore,
            adminFeedback: vspFeedback || null,
            reviewedBy: payload.userId,
            reviewedAt: new Date(),
            score: spScore,
            percentage: (spScore / 100) * 100,
            passed: spDidPass,
          },
        });

        await prisma.vSCParticipant.update({
          where: { id: spAttempt.participantId },
          data: {
            totalScore: { increment: spScore },
            ...(spDidPass ? { currentRound: spAttempt.round.roundNumber + 1 } : { isEliminated: true, eliminatedAt: spAttempt.round.roundNumber }),
          },
        });

        return successResponse({ message: `Social proof ${spDidPass ? 'verified' : 'rejected'}` });
      }

      // Send VSC notification
      case 'vsc-send-notification': {
        const { participantIds: snIds, title: snTitle, message: snMsg } = body;
        if (!snTitle || !snMsg) return errorResponse('Title and message required', 400);

        let targetIds: string[] = [];
        if (snIds && Array.isArray(snIds)) {
          // Specific participants
          const participants = await prisma.vSCParticipant.findMany({
            where: { id: { in: snIds } },
            select: { userId: true },
          });
          targetIds = participants.map(p => p.userId);
        } else {
          // All paid participants
          const challenge = await prisma.vSCChallenge.findFirst({ where: { isActive: true } });
          if (challenge) {
            const allParts = await prisma.vSCParticipant.findMany({
              where: { challengeId: challenge.id, paymentStatus: 'PAID' },
              select: { userId: true },
            });
            targetIds = allParts.map(p => p.userId);
          }
        }

        if (targetIds.length === 0) return errorResponse('No recipients found', 400);

        await prisma.notification.createMany({
          data: targetIds.map(uid => ({
            userId: uid,
            type: 'SYSTEM' as const,
            title: snTitle,
            message: snMsg,
          })),
        });

        return successResponse({ message: `Notification sent to ${targetIds.length} participants` });
      }

      default:
        return errorResponse('Invalid action', 400);
    }
  } catch (error) {
    console.error('Admin action error:', error);
    return errorResponse('Internal server error', 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return errorResponse('Unauthorized', 401);

    const payload = verifyToken(token);
    if (payload.role !== 'ADMIN') return errorResponse('Forbidden', 403);

    const body = await request.json();
    const { action, startupId, userId, contactId } = body;

    switch (action) {
      case 'delete-startup': {
        if (!startupId) return errorResponse('Startup ID required', 400);

        const startup = await prisma.startup.findUnique({
          where: { id: startupId },
          include: { campaign: { select: { id: true } } },
        });
        if (!startup) return errorResponse('Startup not found', 404);

        // Delete in correct order to respect foreign keys
        // 1. Delete comments (self-referencing: delete replies first)
        await prisma.comment.deleteMany({ where: { startupId, parentId: { not: null } } });
        await prisma.comment.deleteMany({ where: { startupId } });

        // 2. Delete saved startups
        await prisma.savedStartup.deleteMany({ where: { startupId } });

        // 3. Delete documents
        await prisma.document.deleteMany({ where: { startupId } });

        // 4. Delete milestones
        await prisma.milestone.deleteMany({ where: { startupId } });

        // 5. If campaign exists, delete its children then the campaign
        if (startup.campaign) {
          const campaignId = startup.campaign.id;
          await prisma.withdrawal.deleteMany({ where: { campaignId } });
          await prisma.contribution.deleteMany({ where: { campaignId } });
          await prisma.rewardTier.deleteMany({ where: { campaignId } });
          await prisma.campaign.delete({ where: { id: campaignId } });
        }

        // 6. Delete the startup itself
        await prisma.startup.delete({ where: { id: startupId } });

        return successResponse({ message: 'Startup deleted successfully' });
      }

      case 'delete-contact': {
        const { contactId } = body;
        if (!contactId) return errorResponse('Contact ID required', 400);
        await prisma.contactSubmission.delete({ where: { id: contactId } });
        return successResponse({ message: 'Contact deleted' });
      }

      case 'delete-user': {
        if (!userId) return errorResponse('User ID required', 400);

        const targetUser = await prisma.user.findUnique({
          where: { id: userId },
          include: {
            startups: { include: { campaign: { select: { id: true } } } },
          },
        });
        if (!targetUser) return errorResponse('User not found', 404);
        if (targetUser.role === 'ADMIN') return errorResponse('Cannot delete admin users', 403);

        // 1. Delete all user's startups and their children
        for (const startup of targetUser.startups) {
          await prisma.comment.deleteMany({ where: { startupId: startup.id, parentId: { not: null } } });
          await prisma.comment.deleteMany({ where: { startupId: startup.id } });
          await prisma.savedStartup.deleteMany({ where: { startupId: startup.id } });
          await prisma.document.deleteMany({ where: { startupId: startup.id } });
          await prisma.milestone.deleteMany({ where: { startupId: startup.id } });

          if (startup.campaign) {
            const campaignId = startup.campaign.id;
            await prisma.withdrawal.deleteMany({ where: { campaignId } });
            await prisma.contribution.deleteMany({ where: { campaignId } });
            await prisma.rewardTier.deleteMany({ where: { campaignId } });
            await prisma.campaign.delete({ where: { id: campaignId } });
          }

          await prisma.startup.delete({ where: { id: startup.id } });
        }

        // 2. Delete user's comments on other startups
        await prisma.comment.deleteMany({ where: { userId, parentId: { not: null } } });
        await prisma.comment.deleteMany({ where: { userId } });

        // 3. Delete user's contributions to other campaigns
        await prisma.contribution.deleteMany({ where: { userId } });

        // 4. Delete user's saved startups
        await prisma.savedStartup.deleteMany({ where: { userId } });

        // 5. Delete user's notifications
        await prisma.notification.deleteMany({ where: { userId } });

        // 6. Delete user's withdrawals (any remaining)
        await prisma.withdrawal.deleteMany({ where: { userId } });

        // 7. Delete competition-related data
        await prisma.cofounderApplication.deleteMany({ where: { applicantId: userId } });
        await prisma.competitionVote.deleteMany({ where: { userId } });
        await prisma.competitionEntry.deleteMany({ where: { userId } });
        await prisma.competitionParticipant.deleteMany({ where: { userId } });
        await prisma.freeEntryReferral.deleteMany({ where: { referredUserId: userId } });
        await prisma.freeEntry.deleteMany({ where: { userId } });

        // 8. Delete VSC-related data
        const vscParticipants = await prisma.vSCParticipant.findMany({ where: { userId }, select: { id: true } });
        const participantIds = vscParticipants.map(p => p.id);
        if (participantIds.length > 0) {
          await prisma.vSCPerformanceReport.deleteMany({ where: { participantId: { in: participantIds } } });
          await prisma.vSCCertificate.deleteMany({ where: { participantId: { in: participantIds } } });
          await prisma.vSCRoundAttempt.deleteMany({ where: { participantId: { in: participantIds } } });
          await prisma.vSCPowerUp.deleteMany({ where: { participantId: { in: participantIds } } });
          await prisma.vSCTeamMember.deleteMany({ where: { userId } });
          await prisma.vSCParticipant.deleteMany({ where: { userId } });
        }
        await prisma.vSCRoundAttempt.deleteMany({ where: { userId } });
        await prisma.vSCPowerUp.deleteMany({ where: { userId } });
        await prisma.vSCCertificate.deleteMany({ where: { userId } });
        const dailyStreaks = await prisma.vSCDailyStreak.findMany({ where: { userId }, select: { id: true } });
        if (dailyStreaks.length > 0) {
          await prisma.vSCDailyAttempt.deleteMany({ where: { streakId: { in: dailyStreaks.map(s => s.id) } } });
          await prisma.vSCDailyStreak.deleteMany({ where: { userId } });
        }
        await prisma.vSCSubscription.deleteMany({ where: { userId } });
        await prisma.vSCTournamentEntry.deleteMany({ where: { userId } });
        await prisma.vSCTeamMember.deleteMany({ where: { userId } });
        await prisma.vSCPerformanceReport.deleteMany({ where: { userId } });

        // 9. Delete the user
        await prisma.user.delete({ where: { id: userId } });

        return successResponse({ message: 'User deleted successfully' });
      }

      default:
        return errorResponse('Invalid action', 400);
    }
  } catch (error) {
    console.error('Admin delete error:', error);
    return errorResponse('Internal server error', 500);
  }
}
