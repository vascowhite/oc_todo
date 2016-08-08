# -*- mode: ruby -*-
# vi: set ft=ruby :

# Vagrantfile API/syntax version. Don't touch unless you know what you're doing!
VAGRANTFILE_API_VERSION = "2"

Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|
  config.vm.box = "debian64_OC_9.0"
  config.vm.box_url = "https://cloud.vascowhite.co.uk/index.php/s/5aqdDjH7ba2jU6t/download"
  config.vm.hostname = "cloud.local"
  # config.ssh.username = "vagrant"
  # config.ssh.password = "vagrant"
  config.vm.synced_folder "./", "/var/www/owncloud/apps/todo", :mount_options => ["dmode=777","fmode=666"]

  # Create a forwarded port mapping which allows access to a specific port
  # within the machine from a port on the host machine. In the example below,
  # accessing "localhost:8080" will access port 80 on the guest machine.
  config.vm.network :forwarded_port, guest: 80, host: 8000
  config.vm.network :forwarded_port, guest: 3306, host: 3306
  # config.vm.network "public_network", type: "dhcp"

  # Don't boot headless
  # config.vm.provider :virtualbox do |vb|
  #   vb.gui = true
  # end

  # Set the Timezone to something useful
  config.vm.provision :shell, :inline => "sudo tee /etc/timezone && dpkg-reconfigure --frontend noninteractive tzdata"

  # Enable Puppet
  # config.vm.provision :puppet do |puppet|
  #   puppet.manifests_path = "puppet/manifests"
  #   puppet.module_path  = "puppet/modules"
  #   puppet.options = ['--verbose']
  # end
end
