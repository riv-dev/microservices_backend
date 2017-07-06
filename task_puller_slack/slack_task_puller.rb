require "slack"
require "yaml"
require "./credentials.rb"

class SlackTaskPuller

  def self.get_new_tasks
    persistence = YAML.load_file('persistence.yml')
    last_retrieve_time = persistence["last_retrieve_time"]
    retrieve_time = Time.now.to_f.round(6)
    persistence["last_retrieve_time"] = retrieve_time

    #Save the last retrieve time
    File.open('persistence.yml','w') do |file| 
      file.write persistence.to_yaml
    end


    tasks = []

    token = Credentials.slack_token
    client = Slack::Client.new token: token

    # Get users list
    puts "Get users list"
    users = Hash[client.users_list["members"].map{|m| [m["id"], m["name"]]}]

    puts YAML.dump users
    puts
    puts

    # Get channels list
    puts "Get channels list"
    channels = client.channels_list["channels"]
    puts YAML.dump channels
    puts
    puts

    # Get channel history
    channels.each do |c|
      puts "- id: #{c["id"]}, name: #{c["name"]}"

      messages = []
      if last_retrieve_time == nil
        messages = client.channels_history(channel: "#{c["id"]}")["messages"]
      else
        messages = client.channels_history(channel: "#{c["id"]}", oldest: last_retrieve_time)["messages"]
      end

      puts "Retrieve time: #{retrieve_time}"

      messages.each do |message|
        user_name = users[message["user"]]
        text = message["text"]
        #puts "#{user_name}: #{text}"
        puts message

        if /^\s*@task\s+/.match(text)
          puts "Adding a new task!!!"
          tasks << {"name" => "Slack Task from #{user_name} in ##{c["name"]} at #{Time.at(message["ts"].to_f).strftime('%c')}", "description" => text}
        end
      end

    end

    return tasks 

  end

end