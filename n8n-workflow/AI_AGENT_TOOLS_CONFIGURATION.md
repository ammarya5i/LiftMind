# AI Agent Tools Configuration for n8n

Complete configuration for all AI Agent tools in your n8n workflow.

## ⚠️ **CRITICAL: Tools Need Execution Nodes!**

**The Problem:** Tools defined in AI Agent don't return data because they need **EXECUTION NODES** connected.

**The Solution:** Each tool definition needs a matching Supabase node that executes when the tool is called.

---

## 📋 **How to Connect Tools to Execution Nodes:**

1. **Define the tool** in AI Agent node (tool configuration below)
2. **Create a Supabase node** for each tool (execution node)
3. **Connect the execution node** back to the AI Agent output

### Tool Definition vs. Execution Node:
- **Tool Definition** = What the AI can call (in AI Agent node)
- **Execution Node** = What actually runs (separate Supabase node connected to workflow)

### Complete Workflow Structure:

```
Webhook Trigger
    ↓
Parse Webhook (Code)
    ↓
Get User (Supabase)
    ↓
IF Node (check if user exists)
    ↓
AI Agent Node
    ├─ Tool: getUser
    ├─ Tool: createUser
    ├─ Tool: logWorkout
    ├─ Tool: getWorkouts
    └─ Tool: getPreferences
    ↓
[Execution Nodes - NOT connected to main flow]
    ├─ Execute: Get User (Supabase)
    ├─ Execute: Create User (Supabase)
    ├─ Execute: Log Workout (Supabase)
    ├─ Execute: Get Workouts (Supabase)
    └─ Execute: Get Preferences (Supabase)
    ↓
Send to WhatsApp (HTTP Request)
```

**Key Point:** The execution nodes are **NOT part of the main flow**. They only run when the AI Agent calls them via tools.

---

## 🔧 **TOOL 1: getUser**

### Purpose
Get user data by phone number

### Configuration
- **Node Type:** Supabase
- **Authentication:** Service Account
- **Resource:** Row
- **Operation:** Get
- **Table:** `users`
- **Filter:** 
  - Field: `phone`
  - Operator: `=`
  - Value: `={{$('Parse Webhook').item.json.phoneNumber}}`

### Return Data Structure
```json
{
  "id": "uuid",
  "phone": "+1234567890",
  "name": "John Doe",
  "email": "john@example.com",
  "preferences": {
    "unit": "kg",
    "experience": "intermediate",
    "goal": "strength"
  },
  "created_at": "2024-01-01T00:00:00Z"
}
```

---

## 🔧 **TOOL 2: createUser**

### Purpose
Create a new user in the database

### Configuration
- **Node Type:** Supabase
- **Authentication:** Service Account
- **Resource:** Row
- **Operation:** Create
- **Table:** `users`
- **Fields:**
  - `phone`: `={{$('Parse Webhook').item.json.phoneNumber}}`
  - `name`: `=WhatsApp User {{$('Parse Webhook').item.json.phoneNumber}}`
  - `preferences`: `={"unit": "kg", "experience": "intermediate", "goal": "strength"}`

### Return Data Structure
```json
{
  "id": "new-uuid",
  "phone": "+1234567890",
  "name": "WhatsApp User +1234567890",
  "preferences": {
    "unit": "kg",
    "experience": "intermediate",
    "goal": "strength"
  }
}
```

---

## 🔧 **TOOL 3: logWorkout**

### Purpose
Log a workout session

### Configuration
- **Node Type:** Supabase
- **Authentication:** Service Account
- **Resource:** Row
- **Operation:** Create
- **Table:** `workouts`
- **Fields:**
  - `user_id`: `={{$('Get User').item.json[0].id}}` OR `={{$('Create User').item.json.id}}`
  - `date`: `={{ new Date().toISOString().split('T')[0] }}`
  - `lifts`: `={{ $json.lifts }}` (from AI agent)
  - `notes`: `={{ $json.notes }}` (from AI agent)

### Input from AI Agent
```json
{
  "lifts": [
    {
      "exercise": "Bench Press",
      "sets": [
        {"reps": 5, "weight": 100, "rpe": 7, "completed": true},
        {"reps": 5, "weight": 105, "rpe": 8, "completed": true}
      ]
    },
    {
      "exercise": "Squat",
      "sets": [
        {"reps": 5, "weight": 140, "rpe": 8, "completed": true}
      ]
    }
  ],
  "notes": "Felt strong today"
}
```

### Return Data Structure
```json
{
  "id": "workout-uuid",
  "user_id": "user-uuid",
  "date": "2024-01-15",
  "lifts": [...],
  "notes": "Felt strong today",
  "created_at": "2024-01-15T10:00:00Z"
}
```

---

## 🔧 **TOOL 4: getWorkouts**

### Purpose
Get recent workout history

### Configuration
- **Node Type:** Supabase
- **Authentication:** Service Account
- **Resource:** Row
- **Operation:** Get Many
- **Table:** `workouts`
- **Filter:**
  - Field: `user_id`
  - Operator: `=`
  - Value: `={{$('Get User').item.json[0].id}}`
- **Sort:**
  - Field: `date`
  - Order: `DESC`
- **Limit:** `10`

### Return Data Structure
```json
[
  {
    "id": "workout-1-uuid",
    "user_id": "user-uuid",
    "date": "2024-01-15",
    "lifts": [...],
    "notes": "Notes here",
    "created_at": "2024-01-15T10:00:00Z"
  },
  {
    "id": "workout-2-uuid",
    "user_id": "user-uuid",
    "date": "2024-01-14",
    "lifts": [...],
    "notes": "Previous workout",
    "created_at": "2024-01-14T09:00:00Z"
  }
]
```

---

## 🔧 **TOOL 5: getPreferences**

### Purpose
Get user preferences

### Configuration
- **Node Type:** Supabase
- **Authentication:** Service Account
- **Resource:** Row
- **Operation:** Get
- **Table:** `users`
- **Filter:**
  - Field: `id`
  - Operator: `=`
  - Value: `={{$('Get User').item.json[0].id}}`
- **Select Fields:** `preferences`

### Return Data Structure
```json
{
  "preferences": {
    "unit": "kg",
    "experience": "intermediate",
    "goal": "strength",
    "focusArea": "bench press"
  }
}
```

---

## 🔧 **TOOL 6: updatePreferences**

### Purpose
Update user preferences

### Configuration
- **Node Type:** Supabase
- **Authentication:** Service Account
- **Resource:** Row
- **Operation:** Update
- **Table:** `users`
- **Update Key:** `id`
- **Update Key Value:** `={{$('Get User').item.json[0].id}}`
- **Fields:**
  - `preferences`: `={{ $json.preferences }}` (from AI agent)

### Input from AI Agent
```json
{
  "preferences": {
    "unit": "lbs",
    "experience": "advanced",
    "goal": "compete"
  }
}
```

### Return Data Structure
```json
{
  "id": "user-uuid",
  "preferences": {
    "unit": "lbs",
    "experience": "advanced",
    "goal": "compete"
  }
}
```

---

## 📝 **Notes**

1. **All tools use Service Account** authentication for RLS bypass
2. **Get User** returns an array, so use `[0]` to access the first result
3. **Date format:** Use ISO date string `YYYY-MM-DD` for the `date` field
4. **lifts** field uses JSONB, so pass array of lift objects
5. **User ID** must be referenced from either Get User or Create User node

---

## ✅ **Testing**

Test each tool by:
1. Manually executing the node
2. Checking the output JSON
3. Verifying data in Supabase dashboard

---

---

## 🔗 **How to Connect Execution Nodes in n8n:**

### Step-by-Step:

1. **Create Supabase Node** for each tool
   - Example: Create "Execute: Get User" node (Supabase)

2. **Configure the Execution Node:**
   - Same config as the tool definition above
   - Table: `users`
   - Operation: `Get`
   - Filter: `phone = {{ $json.phone }}`

3. **Connect to AI Agent:**
   - In AI Agent node, go to **Tools** tab
   - Find "getUser" tool
   - Click **Connect to Execution**
   - Select your "Execute: Get User" node

4. **Repeat for ALL tools:**
   - getUser → Execute: Get User node
   - createUser → Execute: Create User node
   - logWorkout → Execute: Log Workout node
   - etc.

### ⚠️ **IMPORTANT:**
- Each tool MUST have a matching execution node
- Execution nodes are NOT in the main workflow flow
- They only execute when AI Agent calls the tool
- Connect them in the AI Agent Tools configuration panel

---

**That's all the tool configurations you need!** 🚀

