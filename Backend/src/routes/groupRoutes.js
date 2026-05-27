import express from 'express';
import { 
    createGroup, 
    addMember, 
    getMembers, 
    removeMember, 
    getAllGroups, 
    getGroupDetail,
    getGroupsByUser,
    addMemberByUsername
} from '../controllers/groupController.js';
import { authenticate } from '../middlewares/authMiddleware.js';


const router = express.Router();

router.post('/create', authenticate, createGroup);                            // POST   /api/v1/groups/create
router.post('/add-member', authenticate, addMember);  
router.post('/add-member-by-username', authenticate, addMemberByUsername)                       // POST   /api/v1/groups/add-member
router.get('/:group_id/members', authenticate, getMembers);                   // GET    /api/v1/groups/:group_id/members
router.delete('/:group_id/members/:profile_id', authenticate, removeMember); // DELETE /api/v1/groups/:group_id/members/:profile_id
router.get('/', authenticate, getAllGroups);        // GET /api/v1/groups
router.get('/my-groups', authenticate, getGroupsByUser); // GET /api/v1/groups/my-groups
router.get('/:group_id', authenticate, getGroupDetail); // GET /api/v1/groups/:group_id

export default router;