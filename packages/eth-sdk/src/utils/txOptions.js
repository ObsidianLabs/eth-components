import { t } from '@obsidians/i18n'

export default {
  title: 'Gas',
  list: [
    {
      name: 'gasLimit',
      alias: 'gas',
      className: 'col-4',
      label: t('contract.deploy.gasLimit'),
      icon: 'fas fa-burn',
      placeholder: 'Default: 1,000,000',
      default: '1000000'
    },
    {
      name: 'maxPriorityFeePerGas',
      className: 'col-4',
      label: t('contract.deploy.tip'),
      icon: 'fas fa-hand-holding-usd',
      placeholder: 'max priority fee per gas',
      default: ''
    },
    {
      name: 'maxFeePerGas',
      className: 'col-4',
      label: t('contract.deploy.maxFee'),
      icon: 'fas fa-sack-dollar',
      placeholder: 'max fee per gas',
      default: ''
    }
  ]
}
