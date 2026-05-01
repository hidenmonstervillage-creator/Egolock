import Panel from '../components/ui/Panel'
import SkillRadar from '../components/SkillRadar'
import SkillCard from '../components/SkillCard'
import { SKILLS } from '../lib/skills'

export default function SkillsScreen() {
  return (
    <div className="flex flex-col gap-4">
      <Panel title="AURA">
        <SkillRadar />
      </Panel>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {SKILLS.map(skill => (
          <SkillCard key={skill.id} skillId={skill.id} />
        ))}
      </div>
    </div>
  )
}
